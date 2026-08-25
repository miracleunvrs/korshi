-- =====================================================
-- HouseSM: Начальная схема базы данных
-- =====================================================

-- Расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('resident', 'hoa_official', 'service_provider', 'admin');
CREATE TYPE post_type AS ENUM ('post', 'announcement', 'service', 'help_request', 'poll', 'initiative', 'event', 'official_news', 'official_poll', 'fundraiser');
CREATE TYPE post_status AS ENUM ('active', 'closed', 'archived', 'under_review');
CREATE TYPE territory_type AS ENUM ('entrance', 'building', 'complex');
CREATE TYPE attachment_type AS ENUM ('image', 'document', 'video');
CREATE TYPE reaction_type AS ENUM ('like', 'support', 'thanks');
CREATE TYPE initiative_stage AS ENUM ('proposal', 'discussion', 'voting', 'hoa_review', 'approved', 'fundraising', 'implementation', 'completed', 'rejected');
CREATE TYPE fundraiser_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE chat_type AS ENUM ('complex', 'building', 'entrance', 'thematic', 'direct');
CREATE TYPE chat_member_role AS ENUM ('member', 'admin');
CREATE TYPE message_type AS ENUM ('text', 'image', 'document', 'system');
CREATE TYPE moderation_target AS ENUM ('post', 'comment', 'profile', 'chat_message');
CREATE TYPE moderation_action AS ENUM ('warn', 'hide', 'delete', 'ban', 'restore');

-- =====================================================
-- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: updated_at trigger
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ИЕРАРХИЯ ЖК
-- =====================================================

-- Жилые комплексы
CREATE TABLE complexes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  address     TEXT,
  city        TEXT NOT NULL DEFAULT 'Алматы',
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Дома в ЖК
CREATE TABLE buildings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id  UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  number      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(complex_id, number)
);

-- Подъезды
CREATE TABLE entrances (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  number      INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(building_id, number)
);

-- Квартиры
CREATE TABLE apartments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrance_id UUID NOT NULL REFERENCES entrances(id) ON DELETE CASCADE,
  number      TEXT NOT NULL,
  floor       INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entrance_id, number)
);

-- =====================================================
-- ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ
-- =====================================================

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone         TEXT UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'resident',
  complex_id    UUID REFERENCES complexes(id),
  apartment_id  UUID REFERENCES apartments(id),
  verified      BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at   TIMESTAMPTZ,
  verified_by   UUID REFERENCES profiles(id),
  bio           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_profiles_complex_id ON profiles(complex_id);
CREATE INDEX idx_profiles_apartment_id ON profiles(apartment_id);

-- =====================================================
-- ПУБЛИКАЦИИ (polymorphic)
-- =====================================================

CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  complex_id    UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  building_id   UUID REFERENCES buildings(id),
  entrance_id   UUID REFERENCES entrances(id),
  type          post_type NOT NULL DEFAULT 'post',
  title         TEXT,
  content       TEXT NOT NULL,
  status        post_status NOT NULL DEFAULT 'active',
  is_official   BOOLEAN NOT NULL DEFAULT FALSE,
  territory     territory_type NOT NULL DEFAULT 'complex',
  price         NUMERIC(12, 2),
  currency      TEXT DEFAULT 'KZT',
  views_count   INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_posts_complex_id ON posts(complex_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_building_id ON posts(building_id) WHERE building_id IS NOT NULL;
CREATE INDEX idx_posts_entrance_id ON posts(entrance_id) WHERE entrance_id IS NOT NULL;

-- Медиафайлы к публикациям
CREATE TABLE post_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  type        attachment_type NOT NULL DEFAULT 'image',
  name        TEXT,
  size        BIGINT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_attachments_post_id ON post_attachments(post_id);

-- Комментарии
CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);

-- Реакции
CREATE TABLE reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        reaction_type NOT NULL DEFAULT 'like',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_reactions_post_id ON reactions(post_id);

-- =====================================================
-- ОПРОСЫ
-- =====================================================

CREATE TABLE polls (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  is_multiple   BOOLEAN NOT NULL DEFAULT FALSE,
  ends_at       TIMESTAMPTZ,
  total_votes   INT NOT NULL DEFAULT 0
);

CREATE TABLE poll_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id     UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  votes_count INT NOT NULL DEFAULT 0,
  position    INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);

CREATE TABLE poll_votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id     UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id   UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ограничения single-choice нельзя выразить partial index-подзапросом:
-- PostgreSQL запрещает подзапросы в predicate индекса. Проверяем это триггером.
CREATE UNIQUE INDEX idx_poll_votes_option ON poll_votes(poll_id, user_id, option_id);

CREATE OR REPLACE FUNCTION validate_poll_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  poll_is_multiple BOOLEAN;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.poll_id::TEXT));

  IF NOT EXISTS (
    SELECT 1 FROM poll_options
    WHERE id = NEW.option_id AND poll_id = NEW.poll_id
  ) THEN
    RAISE EXCEPTION 'Poll option does not belong to poll';
  END IF;

  SELECT is_multiple INTO poll_is_multiple FROM polls WHERE id = NEW.poll_id;
  IF poll_is_multiple = FALSE AND EXISTS (
    SELECT 1 FROM poll_votes
    WHERE poll_id = NEW.poll_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'User has already voted in this single-choice poll';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_poll_vote_before_insert
  BEFORE INSERT ON poll_votes
  FOR EACH ROW EXECUTE FUNCTION validate_poll_vote();

CREATE OR REPLACE FUNCTION increment_poll_vote_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE polls SET total_votes = total_votes + 1 WHERE id = NEW.poll_id;
  UPDATE poll_options SET votes_count = votes_count + 1 WHERE id = NEW.option_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_poll_vote_counts_after_insert
  AFTER INSERT ON poll_votes
  FOR EACH ROW EXECUTE FUNCTION increment_poll_vote_counts();

CREATE INDEX idx_poll_votes_poll_id ON poll_votes(poll_id);

-- =====================================================
-- ИНИЦИАТИВЫ
-- =====================================================

CREATE TABLE initiatives (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  stage       initiative_stage NOT NULL DEFAULT 'proposal',
  goal        TEXT,
  supporters  INT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_initiatives_updated_at
  BEFORE UPDATE ON initiatives
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE initiative_supports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id   UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(initiative_id, user_id)
);

CREATE OR REPLACE FUNCTION increment_initiative_supporters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE initiatives SET supporters = supporters + 1 WHERE id = NEW.initiative_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_initiative_supporters_after_insert
  AFTER INSERT ON initiative_supports
  FOR EACH ROW EXECUTE FUNCTION increment_initiative_supporters();

-- =====================================================
-- СБОРЫ
-- =====================================================

CREATE TABLE fundraisers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  initiative_id   UUID REFERENCES initiatives(id),
  target_amount   NUMERIC(14, 2) NOT NULL,
  current_amount  NUMERIC(14, 2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'KZT',
  payment_url     TEXT,
  qr_url          TEXT,
  ends_at         TIMESTAMPTZ,
  status          fundraiser_status NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_fundraisers_updated_at
  BEFORE UPDATE ON fundraisers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE fundraiser_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id   UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id),
  amount          NUMERIC(12, 2) NOT NULL,
  comment         TEXT,
  is_anonymous    BOOLEAN NOT NULL DEFAULT FALSE,
  confirmed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fundraiser_payments_fundraiser_id ON fundraiser_payments(fundraiser_id);

-- =====================================================
-- ЧАТЫ
-- =====================================================

CREATE TABLE chats (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id    UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  building_id   UUID REFERENCES buildings(id),
  entrance_id   UUID REFERENCES entrances(id),
  type          chat_type NOT NULL DEFAULT 'thematic',
  name          TEXT,
  description   TEXT,
  avatar_url    TEXT,
  is_official   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by    UUID REFERENCES profiles(id),
  last_message_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chats_complex_id ON chats(complex_id);

CREATE TABLE chat_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id       UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role          chat_member_role NOT NULL DEFAULT 'member',
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at  TIMESTAMPTZ,
  UNIQUE(chat_id, user_id)
);

CREATE INDEX idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX idx_chat_members_chat_id ON chat_members(chat_id);

CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id       UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reply_to_id   UUID REFERENCES messages(id),
  content       TEXT,
  type          message_type NOT NULL DEFAULT 'text',
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- =====================================================
-- ИСПОЛНИТЕЛИ
-- =====================================================

CREATE TABLE service_providers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  description     TEXT,
  categories      TEXT[] NOT NULL DEFAULT '{}',
  service_areas   UUID[] NOT NULL DEFAULT '{}',
  rating          NUMERIC(3, 2) NOT NULL DEFAULT 0,
  reviews_count   INT NOT NULL DEFAULT 0,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  recommended_by  UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- УВЕДОМЛЕНИЯ
-- =====================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB DEFAULT '{}',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- =====================================================
-- ЖУРНАЛ МОДЕРАЦИИ
-- =====================================================

CREATE TABLE moderation_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id    UUID NOT NULL REFERENCES profiles(id),
  target_type     moderation_target NOT NULL,
  target_id       UUID NOT NULL,
  action          moderation_action NOT NULL,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moderation_logs_moderator ON moderation_logs(moderator_id);
CREATE INDEX idx_moderation_logs_target ON moderation_logs(target_type, target_id);

-- =====================================================
-- ФУНКЦИЯ: Автосоздание профиля при регистрации
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, phone)
  VALUES (NEW.id, NEW.phone)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
