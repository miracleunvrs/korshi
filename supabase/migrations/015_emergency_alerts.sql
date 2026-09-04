-- Korshi: critical building alerts with delivery acknowledgement.

CREATE TABLE emergency_alerts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id            UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  created_by            UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  title                 TEXT NOT NULL CHECK (char_length(title) BETWEEN 4 AND 160),
  message               TEXT NOT NULL CHECK (char_length(message) BETWEEN 5 AND 2000),
  affected_areas        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  expected_resolution   TEXT,
  contact_phone         TEXT,
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at           TIMESTAMPTZ
);

CREATE TABLE emergency_alert_acknowledgements (
  alert_id    UUID NOT NULL REFERENCES emergency_alerts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (alert_id, user_id)
);

CREATE UNIQUE INDEX idx_one_active_emergency_per_complex ON emergency_alerts(complex_id) WHERE active;
CREATE INDEX idx_emergency_alerts_complex_date ON emergency_alerts(complex_id, created_at DESC);

ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alert_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emergency_alerts_select_same_complex" ON emergency_alerts FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "emergency_alerts_manage" ON emergency_alerts FOR ALL USING (complex_id = auth_user_complex_id() AND auth_user_role() IN ('hoa_official', 'admin')) WITH CHECK (complex_id = auth_user_complex_id() AND created_by = auth.uid() AND auth_user_role() IN ('hoa_official', 'admin'));
CREATE POLICY "emergency_ack_select_own_or_management" ON emergency_alert_acknowledgements FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM emergency_alerts alert WHERE alert.id = alert_id AND alert.complex_id = auth_user_complex_id() AND auth_user_role() IN ('hoa_official', 'admin')));
CREATE POLICY "emergency_ack_insert_own" ON emergency_alert_acknowledgements FOR INSERT WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM emergency_alerts alert WHERE alert.id = alert_id AND alert.complex_id = auth_user_complex_id() AND alert.active AND auth_user_verified()));

CREATE OR REPLACE FUNCTION publish_emergency_alert(
  p_title TEXT,
  p_message TEXT,
  p_affected_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_expected_resolution TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL
)
RETURNS emergency_alerts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result emergency_alerts;
BEGIN
  IF COALESCE(auth_user_role() NOT IN ('hoa_official', 'admin'), TRUE) THEN RAISE EXCEPTION 'Only management can publish emergency alerts'; END IF;
  UPDATE emergency_alerts SET active = FALSE, resolved_at = NOW() WHERE complex_id = auth_user_complex_id() AND active;
  INSERT INTO emergency_alerts (complex_id, created_by, title, message, affected_areas, expected_resolution, contact_phone)
  VALUES (auth_user_complex_id(), auth.uid(), trim(p_title), trim(p_message), p_affected_areas, NULLIF(trim(p_expected_resolution), ''), NULLIF(trim(p_contact_phone), ''))
  RETURNING * INTO result;
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT profile.id, 'emergency', result.title, result.message, jsonb_build_object('alert_id', result.id)
  FROM profiles profile WHERE profile.complex_id = result.complex_id AND profile.verified AND profile.id <> auth.uid();
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION resolve_emergency_alert(p_alert_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth_user_role() NOT IN ('hoa_official', 'admin'), TRUE) THEN RAISE EXCEPTION 'Only management can resolve emergency alerts'; END IF;
  UPDATE emergency_alerts SET active = FALSE, resolved_at = NOW()
  WHERE id = p_alert_id AND complex_id = auth_user_complex_id();
END;
$$;

REVOKE ALL ON FUNCTION publish_emergency_alert(TEXT, TEXT, TEXT[], TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION resolve_emergency_alert(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION publish_emergency_alert(TEXT, TEXT, TEXT[], TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_emergency_alert(UUID) TO authenticated;
