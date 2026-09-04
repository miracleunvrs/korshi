-- Korshi: multi-property identity, granular roles, white-label settings and notification delivery.

CREATE TABLE complex_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  complex_id UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  apartment_id UUID REFERENCES apartments(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','tenant','family','chair','admin','dispatcher','executor','guard','concierge')),
  ownership_share NUMERIC(8,5) CHECK (ownership_share IS NULL OR ownership_share > 0),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, complex_id, apartment_id, role)
);

CREATE UNIQUE INDEX idx_one_active_membership_per_user ON complex_memberships(user_id) WHERE is_active;
CREATE INDEX idx_memberships_complex_role ON complex_memberships(complex_id, role);

-- Preserve access for accounts created before the multi-property model.
-- A verified resident linked to an apartment had owner-level voting rights in
-- the legacy schema, so the backfill keeps that behaviour until management
-- explicitly changes the membership role.
INSERT INTO complex_memberships (
  user_id,
  complex_id,
  apartment_id,
  role,
  is_verified,
  is_active
)
SELECT
  profile.id,
  profile.complex_id,
  profile.apartment_id,
  CASE profile.role::TEXT
    WHEN 'hoa_official' THEN 'chair'
    WHEN 'service_provider' THEN 'executor'
    WHEN 'admin' THEN 'admin'
    ELSE 'owner'
  END,
  profile.verified,
  TRUE
FROM profiles profile
WHERE profile.complex_id IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION auth_user_complex_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT membership.complex_id FROM complex_memberships membership WHERE membership.user_id = auth.uid() AND membership.is_active LIMIT 1),
    (SELECT profile.complex_id FROM profiles profile WHERE profile.id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION auth_user_apartment_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT membership.apartment_id FROM complex_memberships membership WHERE membership.user_id = auth.uid() AND membership.is_active LIMIT 1),
    (SELECT profile.apartment_id FROM profiles profile WHERE profile.id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION auth_user_membership_role()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT membership.role FROM complex_memberships membership WHERE membership.user_id = auth.uid() AND membership.is_active LIMIT 1),
    CASE (SELECT profile.role::TEXT FROM profiles profile WHERE profile.id = auth.uid())
      WHEN 'hoa_official' THEN 'chair' WHEN 'service_provider' THEN 'executor' ELSE (SELECT profile.role::TEXT FROM profiles profile WHERE profile.id = auth.uid())
    END
  );
$$;

CREATE OR REPLACE FUNCTION auth_user_can_manage()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(auth_user_membership_role() IN ('chair','admin','dispatcher'), FALSE);
$$;

REVOKE ALL ON FUNCTION auth_user_complex_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_user_apartment_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_user_membership_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_user_can_manage() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_user_complex_id(), auth_user_apartment_id(), auth_user_membership_role(), auth_user_can_manage() TO authenticated;

CREATE TABLE family_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  apartment_id UUID DEFAULT auth_user_apartment_id() REFERENCES apartments(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'family' CHECK (role = 'family'),
  token_hash TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
  complex_id UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (complex_id, role, permission)
);

CREATE TABLE complex_settings (
  complex_id UUID PRIMARY KEY DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#166534' CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  management_phone TEXT,
  management_email TEXT,
  request_categories JSONB NOT NULL DEFAULT '[]'::JSONB,
  custom_roles JSONB NOT NULL DEFAULT '[]'::JSONB,
  house_rules TEXT,
  languages TEXT[] NOT NULL DEFAULT ARRAY['ru'] CHECK (languages <@ ARRAY['ru','kk','en']),
  white_label BOOLEAN NOT NULL DEFAULT FALSE,
  custom_domain TEXT,
  updated_by UUID DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  in_app BOOLEAN NOT NULL DEFAULT TRUE,
  push BOOLEAN NOT NULL DEFAULT TRUE,
  email_critical BOOLEAN NOT NULL DEFAULT TRUE,
  sms_critical BOOLEAN NOT NULL DEFAULT FALSE,
  requests BOOLEAN NOT NULL DEFAULT TRUE,
  community BOOLEAN NOT NULL DEFAULT TRUE,
  voting BOOLEAN NOT NULL DEFAULT TRUE,
  finance BOOLEAN NOT NULL DEFAULT TRUE,
  payments BOOLEAN NOT NULL DEFAULT TRUE,
  emergency BOOLEAN NOT NULL DEFAULT TRUE,
  quiet_hours JSONB NOT NULL DEFAULT '{"from":"22:00","to":"08:00"}'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, complex_id)
);

CREATE TABLE notification_preference_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  changes JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_delivery_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('push','email','sms')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed','cancelled')),
  attempts SMALLINT NOT NULL DEFAULT 0,
  provider_message_id TEXT,
  last_error TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_outbox_pending ON notification_delivery_outbox(status, scheduled_at) WHERE status = 'pending';

CREATE TABLE admin_audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  complex_id UUID REFERENCES complexes(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION audit_management_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_complex UUID;
BEGIN
  target_complex := COALESCE((to_jsonb(NEW)->>'complex_id')::UUID, (to_jsonb(OLD)->>'complex_id')::UUID, auth_user_complex_id());
  INSERT INTO admin_audit_logs(complex_id, actor_id, action, target_table, target_id, old_data, new_data)
  VALUES (target_complex, auth.uid(), TG_OP, TG_TABLE_NAME, COALESCE(to_jsonb(NEW)->>'id', to_jsonb(OLD)->>'id', target_complex::TEXT), CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END, CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_complex_settings AFTER INSERT OR UPDATE OR DELETE ON complex_settings FOR EACH ROW EXECUTE FUNCTION audit_management_change();
CREATE TRIGGER audit_memberships AFTER INSERT OR UPDATE OR DELETE ON complex_memberships FOR EACH ROW EXECUTE FUNCTION audit_management_change();

ALTER TABLE complex_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE complex_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preference_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memberships_read_own_or_management" ON complex_memberships FOR SELECT USING (user_id = auth.uid() OR (complex_id = auth_user_complex_id() AND auth_user_can_manage()));
CREATE POLICY "memberships_manage" ON complex_memberships FOR ALL USING (complex_id = auth_user_complex_id() AND auth_user_can_manage()) WITH CHECK (complex_id = auth_user_complex_id() AND auth_user_can_manage());
CREATE POLICY "memberships_switch_own" ON complex_memberships FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "family_invites_read" ON family_invitations FOR SELECT USING (invited_by = auth.uid() OR (complex_id = auth_user_complex_id() AND auth_user_can_manage()));
CREATE POLICY "family_invites_create" ON family_invitations FOR INSERT WITH CHECK (invited_by = auth.uid() AND complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "family_invites_update" ON family_invitations FOR UPDATE USING (invited_by = auth.uid() OR (complex_id = auth_user_complex_id() AND auth_user_can_manage()));
CREATE POLICY "permissions_read" ON role_permissions FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "permissions_manage" ON role_permissions FOR ALL USING (complex_id = auth_user_complex_id() AND auth_user_can_manage()) WITH CHECK (complex_id = auth_user_complex_id() AND auth_user_can_manage());
CREATE POLICY "settings_read" ON complex_settings FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "settings_manage" ON complex_settings FOR ALL USING (complex_id = auth_user_complex_id() AND auth_user_can_manage()) WITH CHECK (complex_id = auth_user_complex_id() AND auth_user_can_manage());
CREATE POLICY "notification_preferences_own" ON notification_preferences FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND complex_id = auth_user_complex_id());
CREATE POLICY "notification_preference_events_own" ON notification_preference_events FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND complex_id = auth_user_complex_id());
CREATE POLICY "notification_outbox_management" ON notification_delivery_outbox FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_can_manage());
CREATE POLICY "audit_read_management" ON admin_audit_logs FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_can_manage());

REVOKE ALL ON FUNCTION audit_management_change() FROM PUBLIC;
