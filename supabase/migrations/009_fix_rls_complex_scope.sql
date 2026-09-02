-- Korshi: enforce tenant boundaries for HOA mutations and social actions.

DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own" ON posts
  FOR UPDATE USING (
    complex_id = auth_user_complex_id()
    AND (author_id = auth.uid() OR auth_user_role() IN ('admin', 'hoa_official'))
  )
  WITH CHECK (
    complex_id = auth_user_complex_id()
    AND (author_id = auth.uid() OR auth_user_role() IN ('admin', 'hoa_official'))
  );

DROP POLICY IF EXISTS "fundraisers_insert_hoa" ON fundraisers;
CREATE POLICY "fundraisers_insert_hoa" ON fundraisers
  FOR INSERT WITH CHECK (
    auth_user_role() = 'hoa_official'
    AND target_amount > 0
    AND post_id IN (
      SELECT p.id FROM posts p
      WHERE p.author_id = auth.uid()
        AND p.complex_id = auth_user_complex_id()
    )
  );

DROP POLICY IF EXISTS "fundraisers_update_hoa" ON fundraisers;
CREATE POLICY "fundraisers_update_hoa" ON fundraisers
  FOR UPDATE USING (
    auth_user_role() = 'hoa_official'
    AND post_id IN (SELECT p.id FROM posts p WHERE p.complex_id = auth_user_complex_id())
  )
  WITH CHECK (
    post_id IN (SELECT p.id FROM posts p WHERE p.complex_id = auth_user_complex_id())
  );

DROP POLICY IF EXISTS "initiatives_update_hoa" ON initiatives;
CREATE POLICY "initiatives_update_hoa" ON initiatives
  FOR UPDATE USING (
    auth_user_role() IN ('hoa_official', 'admin')
    AND post_id IN (SELECT p.id FROM posts p WHERE p.complex_id = auth_user_complex_id())
  )
  WITH CHECK (
    post_id IN (SELECT p.id FROM posts p WHERE p.complex_id = auth_user_complex_id())
  );

DROP POLICY IF EXISTS "reactions_insert" ON reactions;
CREATE POLICY "reactions_insert" ON reactions
  FOR INSERT WITH CHECK (
    auth_user_verified() = TRUE
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND p.complex_id = auth_user_complex_id()
    )
  );

DROP POLICY IF EXISTS "initiative_supports_insert" ON initiative_supports;
CREATE POLICY "initiative_supports_insert" ON initiative_supports
  FOR INSERT WITH CHECK (
    auth_user_verified() = TRUE
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM initiatives i
      JOIN posts p ON p.id = i.post_id
      WHERE i.id = initiative_id
        AND p.complex_id = auth_user_complex_id()
    )
  );

DROP POLICY IF EXISTS "comments_insert" ON comments;
CREATE POLICY "comments_insert" ON comments
  FOR INSERT WITH CHECK (
    auth_user_verified() = TRUE
    AND author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND p.complex_id = auth_user_complex_id()
    )
  );
