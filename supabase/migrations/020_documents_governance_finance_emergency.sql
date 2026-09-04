-- Korshi: scoped documents, legally safer owner voting, resident billing and incident reports.

CREATE TABLE house_document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES house_document_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (complex_id, parent_id, name)
);

ALTER TABLE house_documents
  ADD COLUMN folder_id UUID REFERENCES house_document_folders(id) ON DELETE SET NULL,
  ADD COLUMN building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  ADD COLUMN entrance_id UUID REFERENCES entrances(id) ON DELETE SET NULL,
  ADD COLUMN searchable_text TEXT,
  ADD COLUMN preview_status TEXT NOT NULL DEFAULT 'pending' CHECK (preview_status IN ('pending','ready','unsupported','failed'));

CREATE INDEX idx_house_documents_search ON house_documents USING GIN (to_tsvector('simple', COALESCE(title,'') || ' ' || COALESCE(description,'') || ' ' || COALESCE(searchable_text,'')));

ALTER TABLE official_votes
  ADD COLUMN agenda JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN auto_close BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN reminder_offsets_minutes INTEGER[] NOT NULL DEFAULT ARRAY[1440,60],
  ADD COLUMN requires_signature BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE official_vote_documents (
  vote_id UUID NOT NULL REFERENCES official_votes(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES house_documents(id) ON DELETE RESTRICT,
  PRIMARY KEY (vote_id, document_id)
);

CREATE TABLE official_vote_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL UNIQUE REFERENCES official_votes(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  snapshot JSONB NOT NULL,
  pdf_url TEXT,
  sha256 TEXT NOT NULL,
  signature_status TEXT NOT NULL DEFAULT 'unsigned' CHECK (signature_status IN ('unsigned','pending','signed','invalid')),
  signature_provider TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE resident_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  period DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  due_on DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','partially_paid','paid','overdue','cancelled')),
  document_id UUID REFERENCES house_documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (apartment_id, period)
);

CREATE TABLE resident_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES resident_invoices(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  provider TEXT NOT NULL,
  provider_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (provider, provider_payment_id)
);

CREATE TABLE payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL UNIQUE REFERENCES resident_payments(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  pdf_url TEXT,
  fiscal_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE finance_transactions ADD COLUMN official_vote_id UUID REFERENCES official_votes(id) ON DELETE SET NULL;

ALTER TABLE emergency_alerts
  ADD COLUMN building_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  ADD COLUMN entrance_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  ADD COLUMN map_geometry JSONB,
  ADD COLUMN final_report TEXT,
  ADD COLUMN final_report_document_id UUID REFERENCES house_documents(id) ON DELETE SET NULL;

CREATE TABLE emergency_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES emergency_alerts(id) ON DELETE CASCADE,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  message TEXT NOT NULL,
  expected_resolution TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['house_document_folders','official_vote_documents','official_vote_protocols','resident_invoices','resident_payments','payment_receipts','emergency_updates'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

CREATE POLICY "folders_read" ON house_document_folders FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "folders_manage" ON house_document_folders FOR ALL USING (complex_id = auth_user_complex_id() AND auth_user_can_manage()) WITH CHECK (complex_id = auth_user_complex_id());
CREATE POLICY "vote_documents_read" ON official_vote_documents FOR SELECT USING (EXISTS (SELECT 1 FROM official_votes vote WHERE vote.id = vote_id AND vote.complex_id = auth_user_complex_id()));
CREATE POLICY "vote_documents_manage" ON official_vote_documents FOR ALL USING (EXISTS (SELECT 1 FROM official_votes vote WHERE vote.id = vote_id AND vote.complex_id = auth_user_complex_id() AND auth_user_can_manage()));
CREATE POLICY "protocols_read" ON official_vote_protocols FOR SELECT USING (EXISTS (SELECT 1 FROM official_votes vote WHERE vote.id = vote_id AND vote.complex_id = auth_user_complex_id() AND auth_user_verified()));
CREATE POLICY "protocols_manage" ON official_vote_protocols FOR ALL USING (EXISTS (SELECT 1 FROM official_votes vote WHERE vote.id = vote_id AND vote.complex_id = auth_user_complex_id() AND auth_user_can_manage()));
CREATE POLICY "invoices_private" ON resident_invoices FOR SELECT USING (apartment_id = auth_user_apartment_id() OR (complex_id = auth_user_complex_id() AND auth_user_can_manage()));
CREATE POLICY "invoices_manage" ON resident_invoices FOR ALL USING (complex_id = auth_user_complex_id() AND auth_user_can_manage()) WITH CHECK (complex_id = auth_user_complex_id());
CREATE POLICY "payments_private" ON resident_payments FOR SELECT USING (user_id = auth.uid() OR apartment_id = auth_user_apartment_id() OR EXISTS (SELECT 1 FROM resident_invoices invoice WHERE invoice.id = invoice_id AND invoice.complex_id = auth_user_complex_id() AND auth_user_can_manage()));
CREATE POLICY "receipts_private" ON payment_receipts FOR SELECT USING (EXISTS (SELECT 1 FROM resident_payments payment WHERE payment.id = payment_id AND (payment.user_id = auth.uid() OR payment.apartment_id = auth_user_apartment_id())));
CREATE POLICY "emergency_updates_read" ON emergency_updates FOR SELECT USING (EXISTS (SELECT 1 FROM emergency_alerts alert WHERE alert.id = alert_id AND alert.complex_id = auth_user_complex_id() AND auth_user_verified()));
CREATE POLICY "emergency_updates_manage" ON emergency_updates FOR ALL USING (EXISTS (SELECT 1 FROM emergency_alerts alert WHERE alert.id = alert_id AND alert.complex_id = auth_user_complex_id() AND auth_user_can_manage()));

CREATE OR REPLACE FUNCTION cast_official_vote(p_vote_id UUID, p_choice official_vote_choice)
RETURNS official_vote_ballots LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE vote_row official_votes; membership_row complex_memberships; apartment_area NUMERIC(8,2); ballot official_vote_ballots;
BEGIN
  SELECT * INTO membership_row FROM complex_memberships WHERE user_id = auth.uid() AND is_active AND is_verified AND role = 'owner' AND apartment_id IS NOT NULL LIMIT 1;
  IF membership_row.id IS NULL THEN RAISE EXCEPTION 'Verified owner membership is required'; END IF;
  SELECT * INTO vote_row FROM official_votes WHERE id = p_vote_id FOR UPDATE;
  IF vote_row.id IS NULL OR vote_row.complex_id <> membership_row.complex_id OR vote_row.status <> 'active' OR NOW() NOT BETWEEN vote_row.starts_at AND vote_row.ends_at THEN RAISE EXCEPTION 'Vote is not active or accessible'; END IF;
  SELECT area_sqm INTO apartment_area FROM apartments WHERE id = membership_row.apartment_id;
  INSERT INTO official_vote_ballots(vote_id, voter_id, apartment_id, choice, weight) VALUES (vote_row.id, auth.uid(), membership_row.apartment_id, p_choice, CASE WHEN vote_row.basis = 'area' THEN COALESCE(apartment_area * COALESCE(membership_row.ownership_share,1),1) ELSE 1 END) RETURNING * INTO ballot;
  RETURN ballot;
END; $$;

CREATE OR REPLACE FUNCTION close_expired_official_votes()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE affected INTEGER;
BEGIN
  UPDATE official_votes SET status = 'completed' WHERE status = 'active' AND auto_close AND ends_at <= NOW();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END; $$;

CREATE OR REPLACE FUNCTION get_document_acknowledgement_stats(p_document_id UUID)
RETURNS TABLE(acknowledged BIGINT, eligible BIGINT, percentage NUMERIC) LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(ack.user_id), COUNT(profile.id), CASE WHEN COUNT(profile.id) = 0 THEN 0 ELSE ROUND(COUNT(ack.user_id)::NUMERIC / COUNT(profile.id) * 100, 1) END
  FROM house_documents document
  JOIN profiles profile ON profile.complex_id = document.complex_id AND profile.verified
  LEFT JOIN house_document_acknowledgements ack ON ack.document_id = document.id AND ack.user_id = profile.id
  WHERE document.id = p_document_id AND document.complex_id = auth_user_complex_id() AND auth_user_can_manage();
$$;

REVOKE ALL ON FUNCTION cast_official_vote(UUID, official_vote_choice), close_expired_official_votes(), get_document_acknowledgement_stats(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cast_official_vote(UUID, official_vote_choice), get_document_acknowledgement_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION close_expired_official_votes() TO service_role;
