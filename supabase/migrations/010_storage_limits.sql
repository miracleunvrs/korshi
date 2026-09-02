-- Ограничения применяются на уровне Supabase Storage и являются финальной защитой
-- независимо от того, какой клиент выполняет загрузку.
UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ]::text[]
WHERE id = 'house-media';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'house-media') THEN
    RAISE EXCEPTION 'Storage bucket house-media must exist before applying upload limits';
  END IF;
END;
$$;
