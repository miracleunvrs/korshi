-- Korshi: resident service desk with media, discussion, SLA and auditable lifecycle.

CREATE TYPE service_request_status AS ENUM ('submitted', 'in_progress', 'resolved', 'closed');
CREATE TYPE service_request_priority AS ENUM ('normal', 'important', 'emergency');
CREATE TYPE service_request_category AS ENUM ('utilities', 'cleaning', 'repair', 'safety', 'territory', 'other');
CREATE TYPE service_request_event_kind AS ENUM ('created', 'comment', 'assigned', 'status_changed', 'resolution', 'rated', 'reopened');
CREATE TYPE service_request_attachment_kind AS ENUM ('evidence', 'resolution');

CREATE TABLE service_requests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  complex_id         UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  building_id        UUID REFERENCES buildings(id) ON DELETE SET NULL,
  entrance_id        UUID REFERENCES entrances(id) ON DELETE SET NULL,
  category           service_request_category NOT NULL,
  title              TEXT NOT NULL CHECK (char_length(title) BETWEEN 4 AND 120),
  description        TEXT NOT NULL CHECK (char_length(description) BETWEEN 8 AND 2000),
  location           TEXT NOT NULL CHECK (char_length(location) BETWEEN 2 AND 160),
  status             service_request_status NOT NULL DEFAULT 'submitted',
  priority           service_request_priority NOT NULL DEFAULT 'normal',
  public_for_complex BOOLEAN NOT NULL DEFAULT FALSE,
  assignee_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assignee_name      TEXT,
  sla_due_at         TIMESTAMPTZ,
  resolution_note    TEXT,
  rating             SMALLINT CHECK (rating BETWEEN 1 AND 5),
  resolved_at        TIMESTAMPTZ,
  closed_at          TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE service_request_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  actor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  kind        service_request_event_kind NOT NULL,
  message     TEXT CHECK (message IS NULL OR char_length(message) <= 2000),
  metadata    JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE service_request_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  path        TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  mime_type   TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  size_bytes  BIGINT NOT NULL CHECK (size_bytes BETWEEN 1 AND 10485760),
  kind        service_request_attachment_kind NOT NULL DEFAULT 'evidence',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_requests_complex_status ON service_requests(complex_id, status, created_at DESC);
CREATE INDEX idx_service_requests_author ON service_requests(created_by, created_at DESC);
CREATE INDEX idx_service_requests_assignee ON service_requests(assignee_id, status, sla_due_at);
CREATE INDEX idx_service_request_events_request ON service_request_events(request_id, created_at);
CREATE INDEX idx_service_request_attachments_request ON service_request_attachments(request_id, created_at);

CREATE TRIGGER set_service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_request_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_request_attachments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION can_view_service_request(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM service_requests request
    WHERE request.id = p_request_id
      AND (
        request.created_by = auth.uid()
        OR request.assignee_id = auth.uid()
        OR (
          request.complex_id = auth_user_complex_id()
          AND (
            auth_user_role() IN ('hoa_official', 'admin')
            OR (request.public_for_complex AND auth_user_verified())
          )
        )
      )
  );
$$;

CREATE POLICY "service_requests_select_visible" ON service_requests
  FOR SELECT USING (can_view_service_request(id));

CREATE POLICY "service_requests_insert_verified" ON service_requests
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND complex_id = auth_user_complex_id()
    AND auth_user_verified() = TRUE
  );

CREATE POLICY "service_requests_update_management" ON service_requests
  FOR UPDATE USING (
    complex_id = auth_user_complex_id()
    AND (
      auth_user_role() IN ('hoa_official', 'admin')
      OR assignee_id = auth.uid()
    )
  )
  WITH CHECK (
    complex_id = auth_user_complex_id()
    AND (
      auth_user_role() IN ('hoa_official', 'admin')
      OR assignee_id = auth.uid()
    )
  );

CREATE POLICY "service_request_events_select_visible" ON service_request_events
  FOR SELECT USING (can_view_service_request(request_id));

CREATE POLICY "service_request_attachments_select_visible" ON service_request_attachments
  FOR SELECT USING (can_view_service_request(request_id));

CREATE POLICY "service_request_attachments_insert_visible" ON service_request_attachments
  FOR INSERT WITH CHECK (
    uploader_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM service_requests request
      WHERE request.id = service_request_attachments.request_id
        AND (
          request.created_by = auth.uid()
          OR request.assignee_id = auth.uid()
          OR (
            request.complex_id = auth_user_complex_id()
            AND auth_user_role() IN ('hoa_official', 'admin')
          )
        )
    )
  );

CREATE POLICY "service_request_attachments_delete_own" ON service_request_attachments
  FOR DELETE USING (uploader_id = auth.uid());

CREATE OR REPLACE FUNCTION add_service_request_comment(p_request_id UUID, p_message TEXT)
RETURNS service_request_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result service_request_events;
BEGIN
  IF NOT can_view_service_request(p_request_id) THEN
    RAISE EXCEPTION 'Service request is not accessible';
  END IF;
  IF char_length(trim(p_message)) < 1 OR char_length(trim(p_message)) > 2000 THEN
    RAISE EXCEPTION 'Comment length is invalid';
  END IF;

  INSERT INTO service_request_events (request_id, actor_id, kind, message)
  VALUES (p_request_id, auth.uid(), 'comment', trim(p_message))
  RETURNING * INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION update_service_request_status(
  p_request_id UUID,
  p_status service_request_status,
  p_note TEXT DEFAULT NULL,
  p_assignee_id UUID DEFAULT NULL,
  p_assignee_name TEXT DEFAULT NULL,
  p_sla_due_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS service_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_row service_requests;
  previous_status service_request_status;
BEGIN
  SELECT * INTO request_row FROM service_requests WHERE id = p_request_id FOR UPDATE;
  IF request_row.id IS NULL OR request_row.complex_id <> auth_user_complex_id() THEN
    RAISE EXCEPTION 'Service request is not accessible';
  END IF;
  IF COALESCE(auth_user_role() NOT IN ('hoa_official', 'admin'), TRUE)
     AND request_row.assignee_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only management or assigned provider can update status';
  END IF;
  IF p_assignee_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM profiles assignee
    WHERE assignee.id = p_assignee_id
      AND assignee.complex_id = request_row.complex_id
      AND assignee.role IN ('service_provider', 'hoa_official', 'admin')
  ) THEN
    RAISE EXCEPTION 'Assignee must be an eligible member of the same complex';
  END IF;
  IF COALESCE(auth_user_role() NOT IN ('hoa_official', 'admin'), TRUE)
     AND (p_assignee_id IS NOT NULL OR NULLIF(trim(p_assignee_name), '') IS NOT NULL OR p_sla_due_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Only management can change assignment or SLA';
  END IF;

  previous_status := request_row.status;
  UPDATE service_requests
  SET status = p_status,
      assignee_id = COALESCE(p_assignee_id, assignee_id),
      assignee_name = COALESCE(NULLIF(trim(p_assignee_name), ''), assignee_name),
      sla_due_at = COALESCE(p_sla_due_at, sla_due_at),
      resolution_note = CASE WHEN p_status = 'resolved' THEN COALESCE(NULLIF(trim(p_note), ''), resolution_note) ELSE resolution_note END,
      resolved_at = CASE WHEN p_status = 'resolved' THEN NOW() ELSE resolved_at END,
      closed_at = CASE WHEN p_status = 'closed' THEN NOW() ELSE closed_at END
  WHERE id = p_request_id
  RETURNING * INTO request_row;

  INSERT INTO service_request_events (request_id, actor_id, kind, message, metadata)
  VALUES (
    p_request_id,
    auth.uid(),
    CASE WHEN p_status = 'resolved' THEN 'resolution'::service_request_event_kind ELSE 'status_changed'::service_request_event_kind END,
    NULLIF(trim(p_note), ''),
    jsonb_build_object('from', previous_status, 'to', p_status, 'assignee_name', p_assignee_name)
  );
  RETURN request_row;
END;
$$;

CREATE OR REPLACE FUNCTION rate_service_request(p_request_id UUID, p_rating SMALLINT)
RETURNS service_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_row service_requests;
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN RAISE EXCEPTION 'Rating must be between 1 and 5'; END IF;
  UPDATE service_requests
  SET rating = p_rating, status = 'closed', closed_at = NOW()
  WHERE id = p_request_id AND created_by = auth.uid() AND status = 'resolved'
  RETURNING * INTO request_row;
  IF request_row.id IS NULL THEN RAISE EXCEPTION 'Resolved request is not accessible'; END IF;

  INSERT INTO service_request_events (request_id, actor_id, kind, metadata)
  VALUES (p_request_id, auth.uid(), 'rated', jsonb_build_object('rating', p_rating));
  RETURN request_row;
END;
$$;

CREATE OR REPLACE FUNCTION reopen_service_request(p_request_id UUID, p_message TEXT)
RETURNS service_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_row service_requests;
BEGIN
  UPDATE service_requests
  SET status = 'submitted', rating = NULL, resolved_at = NULL, closed_at = NULL
  WHERE id = p_request_id AND created_by = auth.uid() AND status IN ('resolved', 'closed')
  RETURNING * INTO request_row;
  IF request_row.id IS NULL THEN RAISE EXCEPTION 'Completed request is not accessible'; END IF;

  INSERT INTO service_request_events (request_id, actor_id, kind, message)
  VALUES (p_request_id, auth.uid(), 'reopened', NULLIF(trim(p_message), ''));
  RETURN request_row;
END;
$$;

CREATE OR REPLACE FUNCTION create_service_request_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO service_request_events (request_id, actor_id, kind, message, metadata)
  VALUES (NEW.id, NEW.created_by, 'created', NEW.description, jsonb_build_object('priority', NEW.priority, 'location', NEW.location));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_management_on_service_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT profile.id,
         'service_request',
         CASE WHEN NEW.priority = 'emergency' THEN 'Аварийная заявка жителя' ELSE 'Новая заявка жителя' END,
         NEW.title || ' · ' || NEW.location,
         jsonb_build_object('service_request_id', NEW.id, 'status', NEW.status)
  FROM profiles profile
  WHERE profile.complex_id = NEW.complex_id
    AND profile.role IN ('hoa_official', 'admin')
    AND profile.id <> NEW.created_by;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_resident_on_service_request_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.assignee_name IS DISTINCT FROM OLD.assignee_name THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.created_by,
      'service_request',
      'Заявка обновлена',
      NEW.title || ': ' || CASE NEW.status
        WHEN 'submitted' THEN 'принята'
        WHEN 'in_progress' THEN 'в работе'
        WHEN 'resolved' THEN 'ожидает вашей оценки'
        ELSE 'закрыта'
      END,
      jsonb_build_object('service_request_id', NEW.id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_service_request_initial_event
  AFTER INSERT ON service_requests
  FOR EACH ROW EXECUTE FUNCTION create_service_request_event();

CREATE TRIGGER notify_management_after_service_request
  AFTER INSERT ON service_requests
  FOR EACH ROW EXECUTE FUNCTION notify_management_on_service_request();

CREATE TRIGGER notify_resident_after_service_request_update
  AFTER UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION notify_resident_on_service_request_update();

CREATE POLICY "house_media_read_request_media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'house-media'
    AND (storage.foldername(name))[2] = 'requests'
    AND (storage.foldername(name))[3] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND can_view_service_request(((storage.foldername(name))[3])::UUID)
    AND EXISTS (
      SELECT 1 FROM service_request_attachments attachment
      WHERE attachment.request_id = ((storage.foldername(name))[3])::UUID
        AND attachment.path = name
    )
  );

REVOKE ALL ON FUNCTION can_view_service_request(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION add_service_request_comment(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION update_service_request_status(UUID, service_request_status, TEXT, UUID, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION rate_service_request(UUID, SMALLINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION reopen_service_request(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION create_service_request_event() FROM PUBLIC;
REVOKE ALL ON FUNCTION notify_management_on_service_request() FROM PUBLIC;
REVOKE ALL ON FUNCTION notify_resident_on_service_request_update() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION can_view_service_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_service_request_comment(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_service_request_status(UUID, service_request_status, TEXT, UUID, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION rate_service_request(UUID, SMALLINT) TO authenticated;
GRANT EXECUTE ON FUNCTION reopen_service_request(UUID, TEXT) TO authenticated;
