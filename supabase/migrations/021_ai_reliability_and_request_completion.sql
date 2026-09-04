-- Korshi: AI audit trail, analytics, rate limiting and remaining request lifecycle controls.

ALTER TYPE service_request_event_kind ADD VALUE IF NOT EXISTS 'merged';
ALTER TYPE service_request_event_kind ADD VALUE IF NOT EXISTS 'sla_breached';

CREATE TABLE service_request_duplicates (
  primary_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  duplicate_request_id UUID NOT NULL UNIQUE REFERENCES service_requests(id) ON DELETE CASCADE,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  suggested_by TEXT NOT NULL DEFAULT 'human' CHECK (suggested_by IN ('human','ai')),
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (primary_request_id <> duplicate_request_id),
  PRIMARY KEY (primary_request_id, duplicate_request_id)
);

CREATE TABLE ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('request_triage','image_analysis','similar_requests','discussion_summary','document_qa','translate','decision_draft','meeting_protocol','monthly_summary','overdue_detection','moderation')),
  input_hash TEXT NOT NULL,
  provider_response_id TEXT,
  result JSONB,
  source_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  human_review_required BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','cancelled')),
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES ai_jobs(id) ON DELETE SET NULL,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  response_id TEXT,
  feature TEXT NOT NULL,
  helpful BOOLEAN NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES house_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  source_page INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, chunk_index)
);

CREATE TABLE analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  complex_id UUID DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE SET NULL,
  user_id UUID DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  event_name TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rate_limit_buckets (
  bucket_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE integration_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL,
  payload_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','processed','ignored','failed')),
  error_code TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE (provider, provider_event_id)
);

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['service_request_duplicates','ai_jobs','ai_feedback','document_chunks','analytics_events','rate_limit_buckets','integration_webhook_events'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

CREATE POLICY "request_duplicates_read" ON service_request_duplicates FOR SELECT USING (can_view_service_request(primary_request_id) AND can_view_service_request(duplicate_request_id));
CREATE POLICY "request_duplicates_manage" ON service_request_duplicates FOR ALL USING (auth_user_can_manage()) WITH CHECK (auth_user_can_manage());
CREATE POLICY "ai_jobs_own" ON ai_jobs FOR SELECT USING (user_id = auth.uid() OR (complex_id = auth_user_complex_id() AND auth_user_can_manage()));
CREATE POLICY "ai_jobs_create" ON ai_jobs FOR INSERT WITH CHECK (user_id = auth.uid() AND complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "ai_feedback_own" ON ai_feedback FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "document_chunks_read" ON document_chunks FOR SELECT USING (EXISTS (SELECT 1 FROM house_documents document WHERE document.id = document_id AND document.complex_id = auth_user_complex_id() AND auth_user_verified()));
CREATE POLICY "analytics_insert" ON analytics_events FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "analytics_management_read" ON analytics_events FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_can_manage());

CREATE OR REPLACE FUNCTION consume_rate_limit(p_bucket_key TEXT, p_limit INTEGER, p_window_seconds INTEGER)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_bucket rate_limit_buckets;
BEGIN
  IF p_limit < 1 OR p_window_seconds < 1 OR char_length(p_bucket_key) > 160 THEN RETURN FALSE; END IF;
  INSERT INTO rate_limit_buckets(bucket_key, count) VALUES (p_bucket_key, 1)
  ON CONFLICT (bucket_key) DO UPDATE SET
    count = CASE WHEN rate_limit_buckets.window_started_at + make_interval(secs => p_window_seconds) <= NOW() THEN 1 ELSE rate_limit_buckets.count + 1 END,
    window_started_at = CASE WHEN rate_limit_buckets.window_started_at + make_interval(secs => p_window_seconds) <= NOW() THEN NOW() ELSE rate_limit_buckets.window_started_at END,
    updated_at = NOW()
  RETURNING * INTO current_bucket;
  RETURN current_bucket.count <= p_limit;
END; $$;

CREATE OR REPLACE FUNCTION merge_service_requests(p_primary_id UUID, p_duplicate_id UUID, p_confidence NUMERIC DEFAULT NULL, p_suggested_by TEXT DEFAULT 'human')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE primary_row service_requests; duplicate_row service_requests;
BEGIN
  IF COALESCE(NOT auth_user_can_manage(), TRUE) THEN RAISE EXCEPTION 'Only management can merge requests'; END IF;
  SELECT * INTO primary_row FROM service_requests WHERE id = p_primary_id AND complex_id = auth_user_complex_id() FOR UPDATE;
  SELECT * INTO duplicate_row FROM service_requests WHERE id = p_duplicate_id AND complex_id = auth_user_complex_id() FOR UPDATE;
  IF primary_row.id IS NULL OR duplicate_row.id IS NULL OR p_primary_id = p_duplicate_id THEN RAISE EXCEPTION 'Invalid merge target'; END IF;
  INSERT INTO service_request_duplicates(primary_request_id, duplicate_request_id, confidence, suggested_by, approved_by) VALUES (p_primary_id, p_duplicate_id, p_confidence, p_suggested_by, auth.uid());
  UPDATE service_requests SET status = 'closed', resolution_note = 'Объединено с заявкой ' || p_primary_id::TEXT, closed_at = NOW() WHERE id = p_duplicate_id;
  INSERT INTO service_request_events(request_id, actor_id, kind, message) VALUES (p_primary_id, auth.uid(), 'merged', 'Добавлена дублирующая заявка ' || p_duplicate_id::TEXT);
END; $$;

CREATE OR REPLACE FUNCTION mark_overdue_service_requests()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE affected INTEGER;
BEGIN
  INSERT INTO service_request_events(request_id, actor_id, kind, message)
  SELECT request.id, NULL, 'sla_breached', 'Срок SLA истёк' FROM service_requests request
  WHERE request.sla_due_at < NOW() AND request.status IN ('submitted','in_progress')
    AND NOT EXISTS (SELECT 1 FROM service_request_events event WHERE event.request_id = request.id AND event.kind = 'sla_breached');
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END; $$;

REVOKE ALL ON FUNCTION consume_rate_limit(TEXT, INTEGER, INTEGER), merge_service_requests(UUID, UUID, NUMERIC, TEXT), mark_overdue_service_requests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_rate_limit(TEXT, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION merge_service_requests(UUID, UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_overdue_service_requests() TO service_role;

CREATE INDEX idx_ai_jobs_user_date ON ai_jobs(user_id, created_at DESC);
CREATE INDEX idx_analytics_complex_date ON analytics_events(complex_id, occurred_at DESC);
CREATE INDEX idx_document_chunks_document ON document_chunks(document_id, chunk_index);
