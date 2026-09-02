-- Fix chat membership escalation: users may only join chats available to
-- their own verified profile. Direct chats are created through the RPC below.
DROP POLICY IF EXISTS "chat_members_insert" ON chat_members;
CREATE POLICY "chat_members_insert" ON chat_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND auth_user_verified() = TRUE
    AND EXISTS (
      SELECT 1
      FROM chats c
      WHERE c.id = chat_id
        AND c.complex_id = auth_user_complex_id()
        AND (
          c.type IN ('complex', 'thematic')
          OR (
            c.type = 'building'
            AND c.building_id IN (
              SELECT e.building_id
              FROM apartments a
              JOIN entrances e ON e.id = a.entrance_id
              WHERE a.id = auth_user_apartment_id()
            )
          )
          OR (
            c.type = 'entrance'
            AND c.entrance_id = (
              SELECT a.entrance_id
              FROM apartments a
              WHERE a.id = auth_user_apartment_id()
            )
          )
        )
    )
  );

-- Direct chat creation must add both members atomically and verify that both
-- accounts belong to the same complex.
CREATE OR REPLACE FUNCTION create_direct_chat(p_target_user UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID := auth.uid();
  caller_complex UUID;
  target_complex UUID;
  new_chat_id UUID;
BEGIN
  IF caller_id IS NULL OR p_target_user IS NULL OR caller_id = p_target_user THEN
    RAISE EXCEPTION 'Invalid direct chat participants';
  END IF;

  SELECT complex_id INTO caller_complex FROM profiles
  WHERE id = caller_id AND verified = TRUE;
  SELECT complex_id INTO target_complex FROM profiles
  WHERE id = p_target_user AND verified = TRUE;

  IF caller_complex IS NULL OR target_complex IS NULL OR caller_complex <> target_complex THEN
    RAISE EXCEPTION 'Users must be verified residents of the same complex';
  END IF;

  SELECT c.id INTO new_chat_id
  FROM chats c
  JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = caller_id
  JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = p_target_user
  WHERE c.type = 'direct' AND c.complex_id = caller_complex
  LIMIT 1;

  IF new_chat_id IS NOT NULL THEN
    RETURN new_chat_id;
  END IF;

  INSERT INTO chats (complex_id, type, name, created_by)
  VALUES (caller_complex, 'direct', 'Личный чат', caller_id)
  RETURNING id INTO new_chat_id;

  INSERT INTO chat_members (chat_id, user_id)
  VALUES (new_chat_id, caller_id), (new_chat_id, p_target_user);

  RETURN new_chat_id;
END;
$$;

REVOKE ALL ON FUNCTION create_direct_chat(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_direct_chat(UUID) TO authenticated;

-- Payments are written only by the validated SECURITY DEFINER RPC. The old
-- INSERT policy allowed fabricated payment rows that did not update totals.
DROP POLICY IF EXISTS "fundraiser_payments_insert" ON fundraiser_payments;

CREATE OR REPLACE FUNCTION record_fundraiser_payment(
  p_fundraiser_id UUID,
  p_amount NUMERIC,
  p_comment TEXT DEFAULT NULL,
  p_is_anonymous BOOLEAN DEFAULT FALSE
)
RETURNS fundraiser_payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment fundraiser_payments;
  fundraiser fundraisers;
BEGIN
  IF auth.uid() IS NULL OR auth_user_verified() <> TRUE
     OR p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid payment';
  END IF;

  SELECT f.* INTO fundraiser
  FROM fundraisers f
  JOIN posts p ON p.id = f.post_id
  WHERE f.id = p_fundraiser_id
    AND p.complex_id = auth_user_complex_id()
  FOR UPDATE;

  IF fundraiser.id IS NULL OR fundraiser.status <> 'active'
     OR (fundraiser.ends_at IS NOT NULL AND fundraiser.ends_at < NOW()) THEN
    RAISE EXCEPTION 'Fundraiser is not active';
  END IF;

  INSERT INTO fundraiser_payments (
    fundraiser_id, user_id, amount, comment, is_anonymous, confirmed_at
  )
  VALUES (p_fundraiser_id, auth.uid(), p_amount, p_comment, p_is_anonymous, NOW())
  RETURNING * INTO payment;

  UPDATE fundraisers
  SET current_amount = current_amount + p_amount
  WHERE id = p_fundraiser_id;

  RETURN payment;
END;
$$;

GRANT EXECUTE ON FUNCTION record_fundraiser_payment(UUID, NUMERIC, TEXT, BOOLEAN) TO authenticated;

-- Resolve registration by the full apartment path first. Building numbers are
-- only unique inside a complex, so never choose an arbitrary matching complex.
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

  SELECT a.id, b.complex_id
    INTO matched_apartment_id, matched_complex_id
  FROM apartments a
  JOIN entrances e ON e.id = a.entrance_id
  JOIN buildings b ON b.id = e.building_id
  WHERE b.number = NEW.raw_user_meta_data ->> 'building_number'
    AND e.number = COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'entrance_number', '')::INT, 1)
    AND a.number = NEW.raw_user_meta_data ->> 'apartment_number'
  LIMIT 1;

  INSERT INTO profiles (id, phone, full_name, avatar_url, role, complex_id, apartment_id)
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

-- Review a verification request and update the resident profile in the same
-- transaction, preventing an approved request with an unverified profile.
CREATE OR REPLACE FUNCTION review_verification_request(
  p_request_id UUID,
  p_approved BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS verification_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID := auth.uid();
  request_row verification_requests;
BEGIN
  IF caller_id IS NULL OR auth_user_role() <> 'admin'::user_role THEN
    RAISE EXCEPTION 'Only administrators can review verification requests';
  END IF;

  SELECT vr.* INTO request_row
  FROM verification_requests vr
  JOIN profiles target ON target.id = vr.user_id
  WHERE vr.id = p_request_id
    AND target.complex_id = auth_user_complex_id()
  FOR UPDATE;

  IF request_row.id IS NULL THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;

  UPDATE verification_requests
  SET status = CASE WHEN p_approved THEN 'approved'::verification_request_status ELSE 'rejected'::verification_request_status END,
      reviewed_by = caller_id,
      review_reason = NULLIF(p_reason, '')
  WHERE id = p_request_id
  RETURNING * INTO request_row;

  IF p_approved THEN
    UPDATE profiles
    SET verified = TRUE,
        verified_at = NOW(),
        verified_by = caller_id
    WHERE id = request_row.user_id;
  END IF;

  RETURN request_row;
END;
$$;

REVOKE ALL ON FUNCTION review_verification_request(UUID, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION review_verification_request(UUID, BOOLEAN, TEXT) TO authenticated;

-- Enable the shared realtime stream used by both web and Flutter clients.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE
        public.posts,
        public.poll_votes,
        public.comments,
        public.reactions,
        public.chats,
        public.messages,
        public.classifieds;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END
$$;
