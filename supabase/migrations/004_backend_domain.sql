-- Доменные сущности, которых не хватало для реального frontend/backend потока.

CREATE TYPE verification_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE verification_requests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  phone             TEXT,
  building_number   TEXT NOT NULL,
  entrance_number   INT NOT NULL,
  apartment_number  TEXT NOT NULL,
  document_type     TEXT NOT NULL,
  document_path     TEXT NOT NULL,
  status            verification_request_status NOT NULL DEFAULT 'pending',
  reviewed_by       UUID REFERENCES profiles(id),
  review_reason     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);

CREATE TABLE classifieds (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  complex_id      UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL,
  price           NUMERIC(12, 2),
  currency        TEXT NOT NULL DEFAULT 'KZT',
  location        TEXT,
  image_path      TEXT,
  description     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_classifieds_complex_created ON classifieds(complex_id, created_at DESC);
CREATE INDEX idx_classifieds_author ON classifieds(author_id);

CREATE TRIGGER set_verification_requests_updated_at
  BEFORE UPDATE ON verification_requests
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_classifieds_updated_at
  BEFORE UPDATE ON classifieds
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Нового жителя автоматически добавляем в доступные чаты его ЖК/дома/подъезда.
CREATE OR REPLACE FUNCTION enroll_profile_in_chats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.complex_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO chat_members (chat_id, user_id)
  SELECT c.id, NEW.id
  FROM chats c
  WHERE c.complex_id = NEW.complex_id
    AND (
      c.type IN ('complex', 'thematic')
      OR (c.type = 'building' AND c.building_id IN (
        SELECT e.building_id
        FROM apartments a
        JOIN entrances e ON e.id = a.entrance_id
        WHERE a.id = NEW.apartment_id
      ))
      OR (c.type = 'entrance' AND c.entrance_id IN (
        SELECT a.entrance_id FROM apartments a WHERE a.id = NEW.apartment_id
      ))
    )
  ON CONFLICT (chat_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_enroll_in_chats
  AFTER INSERT OR UPDATE OF complex_id, apartment_id ON profiles
  FOR EACH ROW EXECUTE FUNCTION enroll_profile_in_chats();

INSERT INTO chat_members (chat_id, user_id)
SELECT c.id, p.id
FROM chats c
JOIN profiles p ON p.complex_id = c.complex_id
WHERE c.type IN ('complex', 'thematic')
   OR (c.type = 'building' AND c.building_id IN (
     SELECT e.building_id
     FROM apartments a
     JOIN entrances e ON e.id = a.entrance_id
     WHERE a.id = p.apartment_id
   ))
   OR (c.type = 'entrance' AND c.entrance_id IN (
     SELECT a.entrance_id FROM apartments a WHERE a.id = p.apartment_id
   ))
ON CONFLICT (chat_id, user_id) DO NOTHING;

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifieds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verification_requests_select_self_or_admin" ON verification_requests
  FOR SELECT USING (
    user_id = auth.uid()
    OR (
      auth_user_role() = 'admin'
      AND EXISTS (
        SELECT 1 FROM profiles target
        WHERE target.id = verification_requests.user_id
          AND target.complex_id = auth_user_complex_id()
      )
    )
  );

CREATE POLICY "verification_requests_insert_self" ON verification_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "verification_requests_update_admin" ON verification_requests
  FOR UPDATE USING (
    auth_user_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM profiles target
      WHERE target.id = verification_requests.user_id
        AND target.complex_id = auth_user_complex_id()
    )
  )
  WITH CHECK (
    reviewed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles target
      WHERE target.id = verification_requests.user_id
        AND target.complex_id = auth_user_complex_id()
    )
  );

CREATE POLICY "classifieds_select_complex" ON classifieds
  FOR SELECT USING (complex_id = auth_user_complex_id());

CREATE POLICY "classifieds_insert_verified" ON classifieds
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND complex_id = auth_user_complex_id()
    AND auth_user_verified() = TRUE
  );

CREATE POLICY "classifieds_update_own" ON classifieds
  FOR UPDATE USING (author_id = auth.uid() OR auth_user_role() = 'admin')
  WITH CHECK (complex_id = auth_user_complex_id());

CREATE POLICY "classifieds_delete_own" ON classifieds
  FOR DELETE USING (author_id = auth.uid() OR auth_user_role() = 'admin');

-- Пост, poll и initiative создаются одной пользовательской операцией.
CREATE POLICY "polls_insert_post_author" ON polls
  FOR INSERT WITH CHECK (
    auth_user_verified() = TRUE
    AND post_id IN (SELECT id FROM posts WHERE author_id = auth.uid())
  );

CREATE POLICY "poll_options_insert_post_author" ON poll_options
  FOR INSERT WITH CHECK (
    poll_id IN (
      SELECT p.id FROM polls p
      JOIN posts post ON post.id = p.post_id
      WHERE post.author_id = auth.uid()
    )
  );

CREATE POLICY "initiatives_insert_post_author" ON initiatives
  FOR INSERT WITH CHECK (
    auth_user_verified() = TRUE
    AND post_id IN (SELECT id FROM posts WHERE author_id = auth.uid())
  );

-- Платёж создаётся только через проверяемый RPC, а не из клиентского insert.
DROP POLICY IF EXISTS "fundraiser_payments_insert" ON fundraiser_payments;
CREATE POLICY "fundraiser_payments_insert" ON fundraiser_payments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND amount > 0
    AND fundraiser_id IN (SELECT id FROM fundraisers WHERE status = 'active')
  );

DROP POLICY IF EXISTS "fundraisers_insert_hoa" ON fundraisers;
CREATE POLICY "fundraisers_insert_hoa" ON fundraisers
  FOR INSERT WITH CHECK (
    auth_user_role() = 'hoa_official'
    AND post_id IN (
      SELECT id FROM posts
      WHERE author_id = auth.uid()
        AND complex_id = auth_user_complex_id()
    )
    AND target_amount > 0
  );

DROP POLICY IF EXISTS "fundraisers_update_hoa" ON fundraisers;
CREATE POLICY "fundraisers_update_hoa" ON fundraisers
  FOR UPDATE USING (
    auth_user_role() = 'hoa_official'
    AND post_id IN (SELECT id FROM posts WHERE complex_id = auth_user_complex_id())
  )
  WITH CHECK (post_id IN (SELECT id FROM posts WHERE complex_id = auth_user_complex_id()));

DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own" ON posts
  FOR UPDATE USING (
    (author_id = auth.uid() OR auth_user_role() IN ('admin', 'hoa_official'))
    AND complex_id = auth_user_complex_id()
  )
  WITH CHECK (
    complex_id = auth_user_complex_id()
    AND (author_id = auth.uid() OR auth_user_role() IN ('admin', 'hoa_official'))
  );

DROP POLICY IF EXISTS "messages_update_own" ON messages;
CREATE POLICY "messages_update_own" ON messages
  FOR UPDATE USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid() AND is_chat_member(chat_id));

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
  IF auth.uid() IS NULL OR p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid payment';
  END IF;

  SELECT * INTO fundraiser
  FROM fundraisers
  WHERE id = p_fundraiser_id
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

-- Приватное хранилище для документов и медиа.
INSERT INTO storage.buckets (id, name, public)
VALUES ('house-media', 'house-media', FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "house_media_upload_own_folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'house-media'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "house_media_read_own_or_admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'house-media'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR auth_user_role() = 'admin'
    )
  );

CREATE POLICY "house_media_delete_own_or_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'house-media'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR auth_user_role() = 'admin'
    )
  );
