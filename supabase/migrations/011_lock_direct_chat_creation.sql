-- Serialize creation for one normalized pair of users. Without this lock two
-- concurrent requests can both pass the lookup and create duplicate chats.
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
  pair_key TEXT;
BEGIN
  IF caller_id IS NULL OR p_target_user IS NULL OR caller_id = p_target_user THEN
    RAISE EXCEPTION 'Invalid direct chat participants';
  END IF;

  -- The same pair gets the same transaction-scoped lock regardless of who
  -- initiates the request. The lock is released automatically on COMMIT.
  pair_key := LEAST(caller_id, p_target_user)::TEXT || ':' ||
              GREATEST(caller_id, p_target_user)::TEXT;
  PERFORM pg_advisory_xact_lock(hashtextextended(pair_key, 0));

  SELECT complex_id INTO caller_complex
  FROM profiles
  WHERE id = caller_id AND verified = TRUE;

  SELECT complex_id INTO target_complex
  FROM profiles
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
