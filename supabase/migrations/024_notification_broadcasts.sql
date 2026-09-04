CREATE TABLE notification_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'],
  audience JSONB NOT NULL DEFAULT '{"scope":"complex"}'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft','pending','processing','sent','failed','cancelled')),
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE notification_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "broadcasts_management" ON notification_broadcasts FOR ALL USING (complex_id = auth_user_complex_id() AND auth_user_can_manage()) WITH CHECK (complex_id = auth_user_complex_id() AND created_by = auth.uid() AND auth_user_can_manage());
