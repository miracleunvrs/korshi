-- Korshi: access control, parking, SOS and auditable work orders.

CREATE TABLE access_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL CHECK (char_length(guest_name) BETWEEN 2 AND 120),
  kind TEXT NOT NULL CHECK (kind IN ('single','permanent','courier','vehicle')),
  access_code TEXT NOT NULL DEFAULT upper(substr(encode(gen_random_bytes(10), 'hex'), 1, 10)),
  token_hash TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  vehicle_plate TEXT,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','used','revoked','expired')),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (complex_id, access_code)
);

CREATE TABLE access_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  pass_id UUID REFERENCES access_passes(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('entry','exit')),
  checkpoint TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('allowed','denied')),
  provider_event_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (complex_id, provider_event_id)
);

CREATE TABLE access_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  list_type TEXT NOT NULL CHECK (list_type IN ('allow','deny')),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('person','vehicle','provider')),
  subject_value TEXT NOT NULL,
  reason TEXT,
  valid_until TIMESTAMPTZ,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE access_integration_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL,
  device_id TEXT NOT NULL,
  command TEXT NOT NULL CHECK (command IN ('open_door','open_barrier','lock','sync_pass')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','confirmed','failed','cancelled')),
  provider_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE sos_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','acknowledged','resolved','false_alarm')),
  acknowledged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE parking_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  apartment_id UUID REFERENCES apartments(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  zone TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('resident','guest','accessible')),
  status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free','occupied','reserved','blocked','maintenance')),
  map_x NUMERIC(6,3),
  map_y NUMERIC(6,3),
  UNIQUE (complex_id, label)
);

CREATE TABLE parking_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  parking_spot_id UUID NOT NULL REFERENCES parking_spots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_plate TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL CHECK (ends_at > starts_at),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','completed','no_show')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE parking_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  parking_spot_id UUID REFERENCES parking_spots(id) ON DELETE SET NULL,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  vehicle_plate TEXT,
  reason TEXT NOT NULL,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_review','resolved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  entrance_id UUID REFERENCES entrances(id) ON DELETE SET NULL,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('cleaning','repair','outage','lift','pest_control','inspection','other')),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','missed','cancelled')),
  performer_geo POINT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE work_order_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position SMALLINT NOT NULL DEFAULT 0,
  completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ
);

CREATE TABLE work_order_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL CHECK (kind IN ('before','after','report')),
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE work_ratings (
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (work_order_id, user_id)
);

CREATE INDEX idx_access_events_complex_date ON access_events(complex_id, occurred_at DESC);
CREATE INDEX idx_parking_bookings_spot_time ON parking_bookings(parking_spot_id, starts_at, ends_at);
CREATE INDEX idx_work_orders_complex_status ON work_orders(complex_id, status, starts_at);

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['access_passes','access_events','access_lists','access_integration_commands','sos_incidents','parking_spots','parking_bookings','parking_reports','work_orders','work_order_checklist_items','work_order_attachments','work_ratings'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

CREATE POLICY "access_passes_scope" ON access_passes FOR SELECT USING (resident_id = auth.uid() OR (complex_id = auth_user_complex_id() AND auth_user_membership_role() IN ('chair','admin','dispatcher','guard','concierge')));
CREATE POLICY "access_passes_create_own" ON access_passes FOR INSERT WITH CHECK (resident_id = auth.uid() AND complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "access_passes_update_own_or_security" ON access_passes FOR UPDATE USING (resident_id = auth.uid() OR (complex_id = auth_user_complex_id() AND auth_user_membership_role() IN ('chair','admin','dispatcher','guard','concierge'))) WITH CHECK (complex_id = auth_user_complex_id());
CREATE POLICY "access_events_scope" ON access_events FOR SELECT USING (complex_id = auth_user_complex_id() AND (auth_user_verified() OR auth_user_membership_role() IN ('guard','concierge')));
CREATE POLICY "access_events_security_insert" ON access_events FOR INSERT WITH CHECK (complex_id = auth_user_complex_id() AND auth_user_membership_role() IN ('chair','admin','dispatcher','guard','concierge'));
CREATE POLICY "access_lists_scope" ON access_lists FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_membership_role() IN ('chair','admin','dispatcher','guard','concierge'));
CREATE POLICY "access_lists_manage" ON access_lists FOR ALL USING (complex_id = auth_user_complex_id() AND auth_user_membership_role() IN ('chair','admin','dispatcher','guard','concierge')) WITH CHECK (complex_id = auth_user_complex_id());
CREATE POLICY "access_commands_security" ON access_integration_commands FOR ALL USING (complex_id = auth_user_complex_id() AND auth_user_membership_role() IN ('chair','admin','dispatcher','guard','concierge')) WITH CHECK (complex_id = auth_user_complex_id());
CREATE POLICY "sos_create" ON sos_incidents FOR INSERT WITH CHECK (created_by = auth.uid() AND complex_id = auth_user_complex_id());
CREATE POLICY "sos_read" ON sos_incidents FOR SELECT USING (created_by = auth.uid() OR (complex_id = auth_user_complex_id() AND auth_user_membership_role() IN ('chair','admin','dispatcher','guard','concierge')));
CREATE POLICY "sos_manage" ON sos_incidents FOR UPDATE USING (complex_id = auth_user_complex_id() AND auth_user_membership_role() IN ('chair','admin','dispatcher','guard','concierge')) WITH CHECK (complex_id = auth_user_complex_id());
CREATE POLICY "parking_spots_read" ON parking_spots FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "parking_spots_manage" ON parking_spots FOR ALL USING (complex_id = auth_user_complex_id() AND auth_user_can_manage()) WITH CHECK (complex_id = auth_user_complex_id());
CREATE POLICY "parking_bookings_read" ON parking_bookings FOR SELECT USING (user_id = auth.uid() OR (complex_id = auth_user_complex_id() AND auth_user_can_manage()));
CREATE POLICY "parking_bookings_own" ON parking_bookings FOR INSERT WITH CHECK (user_id = auth.uid() AND complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "parking_bookings_cancel" ON parking_bookings FOR UPDATE USING (user_id = auth.uid() OR (complex_id = auth_user_complex_id() AND auth_user_can_manage())) WITH CHECK (complex_id = auth_user_complex_id());
CREATE POLICY "parking_reports_read" ON parking_reports FOR SELECT USING (created_by = auth.uid() OR (complex_id = auth_user_complex_id() AND auth_user_can_manage()));
CREATE POLICY "parking_reports_create" ON parking_reports FOR INSERT WITH CHECK (created_by = auth.uid() AND complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "work_orders_read" ON work_orders FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "work_orders_manage" ON work_orders FOR ALL USING (complex_id = auth_user_complex_id() AND (auth_user_can_manage() OR assigned_to = auth.uid())) WITH CHECK (complex_id = auth_user_complex_id());
CREATE POLICY "work_checklist_read" ON work_order_checklist_items FOR SELECT USING (EXISTS (SELECT 1 FROM work_orders work WHERE work.id = work_order_id AND work.complex_id = auth_user_complex_id() AND auth_user_verified()));
CREATE POLICY "work_checklist_manage" ON work_order_checklist_items FOR ALL USING (EXISTS (SELECT 1 FROM work_orders work WHERE work.id = work_order_id AND work.complex_id = auth_user_complex_id() AND (auth_user_can_manage() OR work.assigned_to = auth.uid())));
CREATE POLICY "work_attachments_read" ON work_order_attachments FOR SELECT USING (EXISTS (SELECT 1 FROM work_orders work WHERE work.id = work_order_id AND work.complex_id = auth_user_complex_id() AND auth_user_verified()));
CREATE POLICY "work_attachments_insert" ON work_order_attachments FOR INSERT WITH CHECK (uploaded_by = auth.uid() AND EXISTS (SELECT 1 FROM work_orders work WHERE work.id = work_order_id AND work.complex_id = auth_user_complex_id() AND (auth_user_can_manage() OR work.assigned_to = auth.uid())));
CREATE POLICY "work_ratings_read" ON work_ratings FOR SELECT USING (EXISTS (SELECT 1 FROM work_orders work WHERE work.id = work_order_id AND work.complex_id = auth_user_complex_id()));
CREATE POLICY "work_ratings_own" ON work_ratings FOR INSERT WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM work_orders work WHERE work.id = work_order_id AND work.complex_id = auth_user_complex_id() AND work.status = 'completed'));

CREATE OR REPLACE FUNCTION book_guest_parking(p_spot_id UUID, p_vehicle_plate TEXT, p_starts_at TIMESTAMPTZ, p_ends_at TIMESTAMPTZ)
RETURNS parking_bookings LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE spot parking_spots; booking parking_bookings;
BEGIN
  SELECT * INTO spot FROM parking_spots WHERE id = p_spot_id AND complex_id = auth_user_complex_id() AND kind IN ('guest','accessible') FOR UPDATE;
  IF spot.id IS NULL OR COALESCE(NOT auth_user_verified(), TRUE) OR p_starts_at < NOW() OR p_ends_at <= p_starts_at THEN RAISE EXCEPTION 'Invalid parking booking'; END IF;
  IF EXISTS (SELECT 1 FROM parking_bookings existing WHERE existing.parking_spot_id = p_spot_id AND existing.status = 'confirmed' AND tstzrange(existing.starts_at, existing.ends_at, '[)') && tstzrange(p_starts_at, p_ends_at, '[)')) THEN RAISE EXCEPTION 'Parking spot is already booked'; END IF;
  INSERT INTO parking_bookings(parking_spot_id, vehicle_plate, starts_at, ends_at) VALUES (p_spot_id, upper(trim(p_vehicle_plate)), p_starts_at, p_ends_at) RETURNING * INTO booking;
  RETURN booking;
END; $$;
REVOKE ALL ON FUNCTION book_guest_parking(UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION book_guest_parking(UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
