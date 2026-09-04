-- Korshi: maintenance calendar, amenity booking, visitor access and vehicle registry.

CREATE TYPE home_schedule_kind AS ENUM ('cleaning', 'maintenance', 'outage', 'event');
CREATE TYPE home_schedule_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE amenity_booking_status AS ENUM ('confirmed', 'cancelled', 'completed');
CREATE TYPE visitor_pass_kind AS ENUM ('guest', 'courier', 'vehicle');
CREATE TYPE visitor_pass_status AS ENUM ('active', 'used', 'revoked', 'expired');

CREATE TABLE home_schedule_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id  UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  kind        home_schedule_kind NOT NULL,
  title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  description TEXT,
  location    TEXT NOT NULL,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ,
  status      home_schedule_status NOT NULL DEFAULT 'planned',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE amenity_resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id  UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  location    TEXT NOT NULL,
  capacity    INTEGER CHECK (capacity IS NULL OR capacity > 0),
  price       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE amenity_bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id  UUID NOT NULL REFERENCES amenity_resources(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  starts_at    TIMESTAMPTZ NOT NULL,
  ends_at      TIMESTAMPTZ NOT NULL CHECK (ends_at > starts_at),
  status       amenity_booking_status NOT NULL DEFAULT 'confirmed',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE visitor_passes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id    UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  resident_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guest_name    TEXT NOT NULL CHECK (char_length(guest_name) BETWEEN 2 AND 120),
  kind          visitor_pass_kind NOT NULL DEFAULT 'guest',
  vehicle_plate TEXT,
  access_code   TEXT NOT NULL UNIQUE DEFAULT upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8)),
  valid_from    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until   TIMESTAMPTZ NOT NULL CHECK (valid_until > valid_from),
  status        visitor_pass_status NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE resident_vehicles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id  UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plate       TEXT NOT NULL,
  label       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (complex_id, plate)
);

CREATE INDEX idx_home_schedule_complex_start ON home_schedule_items(complex_id, starts_at);
CREATE INDEX idx_amenity_resources_complex ON amenity_resources(complex_id, is_active);
CREATE INDEX idx_amenity_bookings_resource_start ON amenity_bookings(resource_id, starts_at, ends_at);
CREATE INDEX idx_visitor_passes_resident ON visitor_passes(resident_id, valid_until DESC);
CREATE INDEX idx_resident_vehicles_resident ON resident_vehicles(resident_id);

ALTER TABLE home_schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenity_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenity_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_select_same_complex" ON home_schedule_items FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "schedule_manage" ON home_schedule_items FOR ALL USING (complex_id = auth_user_complex_id() AND auth_user_role() IN ('hoa_official', 'admin')) WITH CHECK (complex_id = auth_user_complex_id() AND created_by = auth.uid() AND auth_user_role() IN ('hoa_official', 'admin'));
CREATE POLICY "resources_select_same_complex" ON amenity_resources FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "resources_manage" ON amenity_resources FOR ALL USING (complex_id = auth_user_complex_id() AND auth_user_role() IN ('hoa_official', 'admin')) WITH CHECK (complex_id = auth_user_complex_id() AND auth_user_role() IN ('hoa_official', 'admin'));
CREATE POLICY "bookings_select_own_or_management" ON amenity_bookings FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM amenity_resources resource WHERE resource.id = resource_id AND resource.complex_id = auth_user_complex_id() AND auth_user_role() IN ('hoa_official', 'admin')));
CREATE POLICY "passes_select_own_or_management" ON visitor_passes FOR SELECT USING (resident_id = auth.uid() OR (complex_id = auth_user_complex_id() AND auth_user_role() IN ('hoa_official', 'admin')));
CREATE POLICY "passes_insert_own" ON visitor_passes FOR INSERT WITH CHECK (resident_id = auth.uid() AND complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "passes_update_own" ON visitor_passes FOR UPDATE USING (resident_id = auth.uid() AND complex_id = auth_user_complex_id()) WITH CHECK (resident_id = auth.uid() AND complex_id = auth_user_complex_id());
CREATE POLICY "vehicles_own_or_management" ON resident_vehicles FOR SELECT USING (resident_id = auth.uid() OR (complex_id = auth_user_complex_id() AND auth_user_role() IN ('hoa_official', 'admin')));
CREATE POLICY "vehicles_insert_own" ON resident_vehicles FOR INSERT WITH CHECK (resident_id = auth.uid() AND complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "vehicles_delete_own" ON resident_vehicles FOR DELETE USING (resident_id = auth.uid());

CREATE OR REPLACE FUNCTION create_amenity_booking(p_resource_id UUID, p_starts_at TIMESTAMPTZ, p_ends_at TIMESTAMPTZ)
RETURNS amenity_bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE resource_row amenity_resources; result amenity_bookings;
BEGIN
  SELECT * INTO resource_row FROM amenity_resources WHERE id = p_resource_id AND is_active FOR UPDATE;
  IF resource_row.id IS NULL
     OR resource_row.complex_id IS DISTINCT FROM auth_user_complex_id()
     OR COALESCE(NOT auth_user_verified(), TRUE)
  THEN RAISE EXCEPTION 'Resource is not accessible'; END IF;
  IF p_starts_at < NOW() OR p_ends_at <= p_starts_at THEN RAISE EXCEPTION 'Invalid booking time'; END IF;
  IF EXISTS (SELECT 1 FROM amenity_bookings booking WHERE booking.resource_id = p_resource_id AND booking.status = 'confirmed' AND tstzrange(booking.starts_at, booking.ends_at, '[)') && tstzrange(p_starts_at, p_ends_at, '[)')) THEN RAISE EXCEPTION 'Selected time is already booked'; END IF;
  INSERT INTO amenity_bookings (resource_id, user_id, starts_at, ends_at)
  VALUES (p_resource_id, auth.uid(), p_starts_at, p_ends_at)
  RETURNING * INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION create_amenity_booking(UUID, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_amenity_booking(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
