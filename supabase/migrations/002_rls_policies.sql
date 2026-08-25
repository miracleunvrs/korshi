-- =====================================================
-- HouseSM: Row Level Security Policies
-- =====================================================

-- Включаем RLS на всех таблицах
ALTER TABLE complexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrances ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraiser_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
-- =====================================================

-- Получить complex_id текущего пользователя
CREATE OR REPLACE FUNCTION auth_user_complex_id()
RETURNS UUID AS $$
  SELECT complex_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Проверить роль текущего пользователя
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Проверить верификацию текущего пользователя
CREATE OR REPLACE FUNCTION auth_user_verified()
RETURNS BOOLEAN AS $$
  SELECT verified FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Проверить, является ли пользователь членом чата
CREATE OR REPLACE FUNCTION is_chat_member(p_chat_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_members
    WHERE chat_id = p_chat_id AND user_id = auth.uid()
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- COMPLEXES
-- =====================================================

CREATE POLICY "complexes_select_all" ON complexes
  FOR SELECT USING (true);

CREATE POLICY "complexes_insert_admin" ON complexes
  FOR INSERT WITH CHECK (auth_user_role() = 'admin');

CREATE POLICY "complexes_update_admin" ON complexes
  FOR UPDATE USING (auth_user_role() = 'admin');

-- =====================================================
-- BUILDINGS
-- =====================================================

CREATE POLICY "buildings_select_all" ON buildings
  FOR SELECT USING (true);

CREATE POLICY "buildings_insert_admin" ON buildings
  FOR INSERT WITH CHECK (auth_user_role() = 'admin');

-- =====================================================
-- ENTRANCES
-- =====================================================

CREATE POLICY "entrances_select_all" ON entrances
  FOR SELECT USING (true);

CREATE POLICY "entrances_insert_admin" ON entrances
  FOR INSERT WITH CHECK (auth_user_role() = 'admin');

-- =====================================================
-- APARTMENTS
-- =====================================================

CREATE POLICY "apartments_select_all" ON apartments
  FOR SELECT USING (true);

CREATE POLICY "apartments_insert_admin" ON apartments
  FOR INSERT WITH CHECK (auth_user_role() = 'admin');

-- =====================================================
-- PROFILES
-- =====================================================

-- Видят только профили своего ЖК + свой профиль
CREATE POLICY "profiles_select_own_complex" ON profiles
  FOR SELECT USING (
    complex_id = auth_user_complex_id()
    OR id = auth.uid()
  );

-- Вставка: только свой профиль (при регистрации)
CREATE POLICY "profiles_insert_self" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Обновление: только своего профиля
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Администратор может верифицировать жителей своего ЖК
CREATE POLICY "profiles_update_admin_verify" ON profiles
  FOR UPDATE USING (
    auth_user_role() = 'admin'
    AND complex_id = auth_user_complex_id()
  );

-- =====================================================
-- POSTS
-- =====================================================

-- Читать посты своего ЖК (с учётом territory)
CREATE POLICY "posts_select_complex" ON posts
  FOR SELECT USING (
    complex_id = auth_user_complex_id()
    AND (
      -- Посты уровня ЖК видят все жители
      territory = 'complex'
      OR
      -- Посты уровня дома — только жители этого дома
      (territory = 'building' AND building_id IN (
        SELECT b.id FROM buildings b
        JOIN apartments a ON a.entrance_id IN (
          SELECT id FROM entrances WHERE building_id = b.id
        )
        JOIN profiles p ON p.apartment_id = a.id
        WHERE p.id = auth.uid()
      ))
      OR
      -- Посты уровня подъезда — только жители подъезда
      (territory = 'entrance' AND entrance_id IN (
        SELECT e.id FROM entrances e
        JOIN apartments a ON a.entrance_id = e.id
        JOIN profiles p ON p.apartment_id = a.id
        WHERE p.id = auth.uid()
      ))
      OR
      -- Автор всегда видит свои посты
      author_id = auth.uid()
    )
  );

-- Создавать посты могут подтверждённые жители
CREATE POLICY "posts_insert_verified" ON posts
  FOR INSERT WITH CHECK (
    auth_user_verified() = TRUE
    AND complex_id = auth_user_complex_id()
    AND author_id = auth.uid()
    -- Официальные посты только для ОСИ
    AND (is_official = FALSE OR auth_user_role() = 'hoa_official')
  );

-- Редактировать: только свои посты или модераторы
CREATE POLICY "posts_update_own" ON posts
  FOR UPDATE USING (
    author_id = auth.uid()
    OR auth_user_role() IN ('admin', 'hoa_official')
  );

-- Удалять: только свои посты или модераторы
CREATE POLICY "posts_delete_own" ON posts
  FOR DELETE USING (
    author_id = auth.uid()
    OR auth_user_role() = 'admin'
  );

-- =====================================================
-- POST_ATTACHMENTS
-- =====================================================

CREATE POLICY "post_attachments_select" ON post_attachments
  FOR SELECT USING (
    post_id IN (SELECT id FROM posts)
  );

CREATE POLICY "post_attachments_insert" ON post_attachments
  FOR INSERT WITH CHECK (
    post_id IN (SELECT id FROM posts WHERE author_id = auth.uid())
  );

-- =====================================================
-- COMMENTS
-- =====================================================

CREATE POLICY "comments_select" ON comments
  FOR SELECT USING (
    post_id IN (SELECT id FROM posts)
  );

CREATE POLICY "comments_insert" ON comments
  FOR INSERT WITH CHECK (
    auth_user_verified() = TRUE
    AND author_id = auth.uid()
    AND post_id IN (SELECT id FROM posts)
  );

CREATE POLICY "comments_update_own" ON comments
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "comments_delete_own" ON comments
  FOR DELETE USING (
    author_id = auth.uid()
    OR auth_user_role() = 'admin'
  );

-- =====================================================
-- REACTIONS
-- =====================================================

CREATE POLICY "reactions_select" ON reactions
  FOR SELECT USING (post_id IN (SELECT id FROM posts));

CREATE POLICY "reactions_insert" ON reactions
  FOR INSERT WITH CHECK (
    auth_user_verified() = TRUE
    AND user_id = auth.uid()
  );

CREATE POLICY "reactions_delete_own" ON reactions
  FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- POLLS
-- =====================================================

CREATE POLICY "polls_select" ON polls
  FOR SELECT USING (post_id IN (SELECT id FROM posts));

CREATE POLICY "poll_options_select" ON poll_options
  FOR SELECT USING (poll_id IN (SELECT id FROM polls));

CREATE POLICY "poll_votes_select_own" ON poll_votes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "poll_votes_insert" ON poll_votes
  FOR INSERT WITH CHECK (
    auth_user_verified() = TRUE
    AND user_id = auth.uid()
  );

-- =====================================================
-- INITIATIVES
-- =====================================================

CREATE POLICY "initiatives_select" ON initiatives
  FOR SELECT USING (post_id IN (SELECT id FROM posts));

CREATE POLICY "initiatives_update_hoa" ON initiatives
  FOR UPDATE USING (auth_user_role() IN ('hoa_official', 'admin'));

CREATE POLICY "initiative_supports_select" ON initiative_supports
  FOR SELECT USING (
    initiative_id IN (SELECT id FROM initiatives)
  );

CREATE POLICY "initiative_supports_insert" ON initiative_supports
  FOR INSERT WITH CHECK (
    auth_user_verified() = TRUE
    AND user_id = auth.uid()
  );

CREATE POLICY "initiative_supports_delete" ON initiative_supports
  FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- FUNDRAISERS
-- =====================================================

CREATE POLICY "fundraisers_select" ON fundraisers
  FOR SELECT USING (post_id IN (SELECT id FROM posts));

CREATE POLICY "fundraisers_insert_hoa" ON fundraisers
  FOR INSERT WITH CHECK (auth_user_role() = 'hoa_official');

CREATE POLICY "fundraisers_update_hoa" ON fundraisers
  FOR UPDATE USING (auth_user_role() = 'hoa_official');

CREATE POLICY "fundraiser_payments_select" ON fundraiser_payments
  FOR SELECT USING (
    fundraiser_id IN (SELECT id FROM fundraisers)
    AND (is_anonymous = FALSE OR user_id = auth.uid())
  );

CREATE POLICY "fundraiser_payments_insert" ON fundraiser_payments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- CHATS
-- =====================================================

CREATE POLICY "chats_select_member" ON chats
  FOR SELECT USING (is_chat_member(id));

CREATE POLICY "chats_insert_verified" ON chats
  FOR INSERT WITH CHECK (
    auth_user_verified() = TRUE
    AND complex_id = auth_user_complex_id()
  );

CREATE POLICY "chat_members_select" ON chat_members
  FOR SELECT USING (is_chat_member(chat_id));

CREATE POLICY "chat_members_insert" ON chat_members
  FOR INSERT WITH CHECK (
    chat_id IN (SELECT id FROM chats)
    AND user_id = auth.uid()
  );

-- =====================================================
-- MESSAGES
-- =====================================================

CREATE POLICY "messages_select_members" ON messages
  FOR SELECT USING (is_chat_member(chat_id));

CREATE POLICY "messages_insert_members" ON messages
  FOR INSERT WITH CHECK (
    is_chat_member(chat_id)
    AND sender_id = auth.uid()
  );

CREATE POLICY "messages_update_own" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

-- =====================================================
-- SERVICE_PROVIDERS
-- =====================================================

CREATE POLICY "service_providers_select" ON service_providers
  FOR SELECT USING (true);

CREATE POLICY "service_providers_insert" ON service_providers
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "service_providers_update_own" ON service_providers
  FOR UPDATE USING (
    profile_id = auth.uid()
    OR auth_user_role() = 'admin'
  );

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- MODERATION_LOGS
-- =====================================================

CREATE POLICY "moderation_logs_select_admin" ON moderation_logs
  FOR SELECT USING (auth_user_role() = 'admin');

CREATE POLICY "moderation_logs_insert_admin" ON moderation_logs
  FOR INSERT WITH CHECK (
    auth_user_role() IN ('admin', 'hoa_official')
  );

