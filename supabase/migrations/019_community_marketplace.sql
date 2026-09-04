-- Korshi: community calendar, clubs, neighbor help and resident-only marketplace trust.

CREATE TABLE community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  reminder_offsets_minutes INTEGER[] NOT NULL DEFAULT ARRAY[1440,60],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','cancelled','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE community_event_rsvps (
  event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  choice TEXT NOT NULL CHECK (choice IN ('going','maybe','not_going')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE community_event_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE community_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE community_club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES community_clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','moderator','owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (club_id, user_id)
);

CREATE TABLE community_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL CHECK (kind IN ('help','lost','pet','group_buy')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(12,2),
  target_quantity INTEGER,
  current_quantity INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE classifieds
  ADD COLUMN listing_type TEXT NOT NULL DEFAULT 'item' CHECK (listing_type IN ('item','parking_rent','storage_rent','neighbor_service','professional_service')),
  ADD COLUMN promoted_until TIMESTAMPTZ,
  ADD COLUMN provider_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- The legacy marketplace already has a status column with a narrower check.
-- Convert the only removed value before widening the allowed workflow states.
UPDATE classifieds SET status = 'archived' WHERE status = 'closed';
ALTER TABLE classifieds DROP CONSTRAINT IF EXISTS classifieds_status_check;
ALTER TABLE classifieds
  ADD CONSTRAINT classifieds_status_check
  CHECK (status IN ('active','reserved','archived','under_review','blocked'));

CREATE TABLE marketplace_favorites (
  classified_id UUID NOT NULL REFERENCES classifieds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (classified_id, user_id)
);

CREATE TABLE marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id UUID NOT NULL REFERENCES classifieds(id) ON DELETE CASCADE,
  author_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT CHECK (text IS NULL OR char_length(text) <= 1200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (classified_id, author_id)
);

CREATE TABLE marketplace_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL DEFAULT auth_user_complex_id() REFERENCES complexes(id) ON DELETE CASCADE,
  classified_id UUID NOT NULL REFERENCES classifieds(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','resolved','rejected')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE marketplace_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id UUID NOT NULL REFERENCES classifieds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  provider_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['community_events','community_event_rsvps','community_event_albums','community_clubs','community_club_members','community_notices','marketplace_favorites','marketplace_reviews','marketplace_reports','marketplace_promotions'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

CREATE POLICY "community_events_read" ON community_events FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "community_events_create" ON community_events FOR INSERT WITH CHECK (created_by = auth.uid() AND complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "community_events_manage" ON community_events FOR UPDATE USING (created_by = auth.uid() OR (complex_id = auth_user_complex_id() AND auth_user_can_manage())) WITH CHECK (complex_id = auth_user_complex_id());
CREATE POLICY "rsvp_read" ON community_event_rsvps FOR SELECT USING (EXISTS (SELECT 1 FROM community_events event WHERE event.id = event_id AND event.complex_id = auth_user_complex_id()));
CREATE POLICY "rsvp_own" ON community_event_rsvps FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM community_events event WHERE event.id = event_id AND event.complex_id = auth_user_complex_id() AND event.status = 'active'));
CREATE POLICY "albums_read" ON community_event_albums FOR SELECT USING (EXISTS (SELECT 1 FROM community_events event WHERE event.id = event_id AND event.complex_id = auth_user_complex_id() AND auth_user_verified()));
CREATE POLICY "albums_upload" ON community_event_albums FOR INSERT WITH CHECK (uploaded_by = auth.uid() AND EXISTS (SELECT 1 FROM community_events event WHERE event.id = event_id AND event.complex_id = auth_user_complex_id()));
CREATE POLICY "clubs_read" ON community_clubs FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "clubs_create" ON community_clubs FOR INSERT WITH CHECK (created_by = auth.uid() AND complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "club_members_read" ON community_club_members FOR SELECT USING (EXISTS (SELECT 1 FROM community_clubs club WHERE club.id = club_id AND club.complex_id = auth_user_complex_id()));
CREATE POLICY "club_members_own" ON community_club_members FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notices_read" ON community_notices FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "notices_create" ON community_notices FOR INSERT WITH CHECK (created_by = auth.uid() AND complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "notices_manage" ON community_notices FOR UPDATE USING (created_by = auth.uid() OR (complex_id = auth_user_complex_id() AND auth_user_can_manage())) WITH CHECK (complex_id = auth_user_complex_id());
CREATE POLICY "favorites_own" ON marketplace_favorites FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews_read_complex" ON marketplace_reviews FOR SELECT USING (EXISTS (SELECT 1 FROM classifieds item WHERE item.id = classified_id AND item.complex_id = auth_user_complex_id()));
CREATE POLICY "reviews_residents_only" ON marketplace_reviews FOR INSERT WITH CHECK (author_id = auth.uid() AND auth_user_verified() AND EXISTS (SELECT 1 FROM classifieds item WHERE item.id = classified_id AND item.complex_id = auth_user_complex_id() AND item.author_id <> auth.uid()));
CREATE POLICY "reports_own_or_management" ON marketplace_reports FOR SELECT USING (reporter_id = auth.uid() OR (complex_id = auth_user_complex_id() AND auth_user_can_manage()));
CREATE POLICY "reports_create" ON marketplace_reports FOR INSERT WITH CHECK (reporter_id = auth.uid() AND complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "reports_moderate" ON marketplace_reports FOR UPDATE USING (complex_id = auth_user_complex_id() AND auth_user_can_manage()) WITH CHECK (complex_id = auth_user_complex_id());
CREATE POLICY "promotions_own_or_management" ON marketplace_promotions FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM classifieds item WHERE item.id = classified_id AND item.complex_id = auth_user_complex_id() AND auth_user_can_manage()));
CREATE POLICY "promotions_create_own" ON marketplace_promotions FOR INSERT WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM classifieds item WHERE item.id = classified_id AND item.author_id = auth.uid()));

CREATE OR REPLACE FUNCTION rsvp_community_event(p_event_id UUID, p_choice TEXT)
RETURNS community_event_rsvps LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE event_row community_events; current_count INTEGER; result community_event_rsvps;
BEGIN
  IF p_choice NOT IN ('going','maybe','not_going') THEN RAISE EXCEPTION 'Invalid RSVP choice'; END IF;
  SELECT * INTO event_row FROM community_events WHERE id = p_event_id AND complex_id = auth_user_complex_id() AND status = 'active' FOR UPDATE;
  IF event_row.id IS NULL OR COALESCE(NOT auth_user_verified(), TRUE) THEN RAISE EXCEPTION 'Event not accessible'; END IF;
  IF p_choice = 'going' AND event_row.capacity IS NOT NULL THEN
    SELECT COUNT(*) INTO current_count FROM community_event_rsvps WHERE event_id = p_event_id AND choice = 'going' AND user_id <> auth.uid();
    IF current_count >= event_row.capacity THEN RAISE EXCEPTION 'Event capacity reached'; END IF;
  END IF;
  INSERT INTO community_event_rsvps(event_id, choice) VALUES (p_event_id, p_choice)
  ON CONFLICT (event_id, user_id) DO UPDATE SET choice = EXCLUDED.choice, updated_at = NOW()
  RETURNING * INTO result;
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION rsvp_community_event(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rsvp_community_event(UUID, TEXT) TO authenticated;
