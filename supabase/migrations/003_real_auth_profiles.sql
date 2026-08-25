-- Реальные аккаунты: перенос регистрационных данных из auth.users в profiles.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role user_role;
  matched_apartment_id UUID;
  matched_complex_id UUID;
BEGIN
  requested_role := CASE
    WHEN NEW.raw_user_meta_data ->> 'role' = 'service_provider'
      THEN 'service_provider'::user_role
    ELSE 'resident'::user_role
  END;

  SELECT b.complex_id
    INTO matched_complex_id
  FROM buildings b
  WHERE b.number = NEW.raw_user_meta_data ->> 'building_number'
  LIMIT 1;

  SELECT a.id
    INTO matched_apartment_id
  FROM apartments a
  JOIN entrances e ON e.id = a.entrance_id
  JOIN buildings b ON b.id = e.building_id
  WHERE b.number = NEW.raw_user_meta_data ->> 'building_number'
    AND e.number = COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'entrance_number', '')::INT, 1)
    AND a.number = NEW.raw_user_meta_data ->> 'apartment_number'
  LIMIT 1;

  INSERT INTO profiles (
    id,
    phone,
    full_name,
    avatar_url,
    role,
    complex_id,
    apartment_id
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, NULLIF(NEW.raw_user_meta_data ->> 'phone', '')),
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'avatar_url', ''),
    requested_role,
    matched_complex_id,
    matched_apartment_id
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION auth_user_apartment_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT apartment_id FROM profiles WHERE id = auth.uid()
$$;

DROP POLICY IF EXISTS "profiles_update_self" ON profiles;

-- Пользователь может редактировать публичные поля, но не может сам повысить
-- роль, подтвердить проживание или перейти в другой ЖК/квартиру.
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = auth_user_role()
    AND verified = auth_user_verified()
    AND complex_id IS NOT DISTINCT FROM auth_user_complex_id()
    AND apartment_id IS NOT DISTINCT FROM auth_user_apartment_id()
  );
