ALTER TABLE amenity_resources
  ADD COLUMN kind TEXT NOT NULL DEFAULT 'room' CHECK (kind IN ('room','sport','bbq','freight_lift','parking')),
  ADD COLUMN rules TEXT,
  ADD COLUMN requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN min_duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (min_duration_minutes > 0),
  ADD COLUMN max_duration_minutes INTEGER NOT NULL DEFAULT 240 CHECK (max_duration_minutes >= min_duration_minutes),
  ADD COLUMN advance_booking_days INTEGER NOT NULL DEFAULT 30 CHECK (advance_booking_days BETWEEN 1 AND 365);

ALTER TABLE amenity_bookings
  ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending','approved','rejected')),
  ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'not_required' CHECK (payment_status IN ('not_required','pending','paid','failed','refunded')),
  ADD COLUMN provider_payment_id TEXT,
  ADD COLUMN reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN cancelled_at TIMESTAMPTZ,
  ADD COLUMN cancellation_reason TEXT;

CREATE OR REPLACE FUNCTION create_amenity_booking(p_resource_id UUID, p_starts_at TIMESTAMPTZ, p_ends_at TIMESTAMPTZ)
RETURNS amenity_bookings LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE resource_row amenity_resources; result amenity_bookings; duration_minutes NUMERIC;
BEGIN
  SELECT * INTO resource_row FROM amenity_resources WHERE id = p_resource_id AND is_active FOR UPDATE;
  duration_minutes := EXTRACT(EPOCH FROM (p_ends_at - p_starts_at)) / 60;
  IF resource_row.id IS NULL OR resource_row.complex_id IS DISTINCT FROM auth_user_complex_id() OR COALESCE(NOT auth_user_verified(), TRUE) THEN RAISE EXCEPTION 'Resource is not accessible'; END IF;
  IF p_starts_at < NOW() OR p_ends_at <= p_starts_at OR p_starts_at > NOW() + make_interval(days => resource_row.advance_booking_days) THEN RAISE EXCEPTION 'Invalid booking time'; END IF;
  IF duration_minutes < resource_row.min_duration_minutes OR duration_minutes > resource_row.max_duration_minutes THEN RAISE EXCEPTION 'Booking duration violates resource rules'; END IF;
  IF EXISTS (SELECT 1 FROM amenity_bookings booking WHERE booking.resource_id = p_resource_id AND booking.status = 'confirmed' AND booking.approval_status <> 'rejected' AND tstzrange(booking.starts_at, booking.ends_at, '[)') && tstzrange(p_starts_at, p_ends_at, '[)')) THEN RAISE EXCEPTION 'Selected time is already booked'; END IF;
  INSERT INTO amenity_bookings(resource_id, user_id, starts_at, ends_at, approval_status, payment_status)
  VALUES (p_resource_id, auth.uid(), p_starts_at, p_ends_at, CASE WHEN resource_row.requires_approval THEN 'pending' ELSE 'approved' END, CASE WHEN resource_row.price > 0 THEN 'pending' ELSE 'not_required' END)
  RETURNING * INTO result;
  RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION cancel_amenity_booking(p_booking_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS amenity_bookings LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result amenity_bookings;
BEGIN
  UPDATE amenity_bookings booking SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = NULLIF(trim(p_reason),'')
  WHERE booking.id = p_booking_id AND (booking.user_id = auth.uid() OR (EXISTS (SELECT 1 FROM amenity_resources resource WHERE resource.id = booking.resource_id AND resource.complex_id = auth_user_complex_id()) AND auth_user_can_manage())) AND booking.status = 'confirmed'
  RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION 'Booking cannot be cancelled'; END IF;
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION cancel_amenity_booking(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_amenity_booking(UUID, TEXT) TO authenticated;
