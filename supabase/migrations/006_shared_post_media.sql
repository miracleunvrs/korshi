-- Post media is private, but residents of the same complex may view it.
-- Verification documents remain private to their owner and administrators.
DROP POLICY IF EXISTS "house_media_read_own_or_admin" ON storage.objects;
CREATE POLICY "house_media_read_scoped" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'house-media'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR auth_user_role() = 'admin'
      OR (
        (storage.foldername(name))[2] = 'posts'
        AND EXISTS (
          SELECT 1
          FROM profiles owner_profile
          WHERE owner_profile.id = ((storage.foldername(name))[1])::UUID
            AND owner_profile.complex_id = auth_user_complex_id()
        )
      )
    )
  );
