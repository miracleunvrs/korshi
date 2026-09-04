-- Korshi: versioned document center with resident acknowledgements.

CREATE TYPE house_document_category AS ENUM ('finance', 'protocol', 'rules', 'contract', 'notice', 'report', 'other');
CREATE TYPE house_document_status AS ENUM ('active', 'archived');

CREATE TABLE house_documents (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id               UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  published_by             UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  title                    TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  description              TEXT CHECK (description IS NULL OR char_length(description) <= 1000),
  category                 house_document_category NOT NULL DEFAULT 'other',
  version                  TEXT NOT NULL DEFAULT '1.0' CHECK (char_length(version) <= 30),
  file_path                TEXT NOT NULL,
  file_name                TEXT NOT NULL,
  mime_type                TEXT NOT NULL CHECK (mime_type IN (
    'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )),
  size_bytes               BIGINT NOT NULL CHECK (size_bytes BETWEEN 1 AND 10485760),
  is_important             BOOLEAN NOT NULL DEFAULT FALSE,
  requires_acknowledgement BOOLEAN NOT NULL DEFAULT FALSE,
  status                   house_document_status NOT NULL DEFAULT 'active',
  published_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE house_document_acknowledgements (
  document_id UUID NOT NULL REFERENCES house_documents(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (document_id, user_id)
);

CREATE INDEX idx_house_documents_complex ON house_documents(complex_id, status, published_at DESC);
CREATE INDEX idx_house_document_ack_user ON house_document_acknowledgements(user_id, created_at DESC);

CREATE TRIGGER set_house_documents_updated_at
  BEFORE UPDATE ON house_documents
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE house_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_document_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "house_documents_select_same_complex" ON house_documents
  FOR SELECT USING (
    complex_id = auth_user_complex_id()
    AND auth_user_verified()
    AND (status = 'active' OR auth_user_role() IN ('hoa_official', 'admin'))
  );

CREATE POLICY "house_documents_insert_management" ON house_documents
  FOR INSERT WITH CHECK (
    published_by = auth.uid()
    AND complex_id = auth_user_complex_id()
    AND auth_user_role() IN ('hoa_official', 'admin')
  );

CREATE POLICY "house_documents_update_management" ON house_documents
  FOR UPDATE USING (
    complex_id = auth_user_complex_id()
    AND auth_user_role() IN ('hoa_official', 'admin')
  ) WITH CHECK (
    complex_id = auth_user_complex_id()
    AND auth_user_role() IN ('hoa_official', 'admin')
  );

CREATE POLICY "house_documents_delete_management" ON house_documents
  FOR DELETE USING (
    complex_id = auth_user_complex_id()
    AND auth_user_role() IN ('hoa_official', 'admin')
  );

CREATE POLICY "house_document_ack_select" ON house_document_acknowledgements
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM house_documents document
      WHERE document.id = document_id
        AND document.complex_id = auth_user_complex_id()
        AND auth_user_role() IN ('hoa_official', 'admin')
    )
  );

CREATE POLICY "house_document_ack_insert_own" ON house_document_acknowledgements
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM house_documents document
      WHERE document.id = document_id
        AND document.complex_id = auth_user_complex_id()
        AND document.status = 'active'
        AND auth_user_verified()
    )
  );

CREATE POLICY "house_media_read_house_documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'house-media'
    AND (storage.foldername(name))[2] = 'documents'
    AND (storage.foldername(name))[3] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND EXISTS (
      SELECT 1 FROM house_documents document
      WHERE document.id = ((storage.foldername(name))[3])::UUID
        AND document.file_path = name
    )
  );

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]::text[]
WHERE id = 'house-media';

CREATE OR REPLACE FUNCTION notify_on_important_house_document()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_important OR NEW.requires_acknowledgement THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    SELECT profile.id,
           'document',
           CASE WHEN NEW.requires_acknowledgement THEN 'Новый документ требует ознакомления' ELSE 'Опубликован важный документ' END,
           NEW.title,
           jsonb_build_object('document_id', NEW.id, 'requires_acknowledgement', NEW.requires_acknowledgement)
    FROM profiles profile
    WHERE profile.complex_id = NEW.complex_id
      AND profile.verified = TRUE
      AND profile.id <> NEW.published_by;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_after_house_document_insert
  AFTER INSERT ON house_documents
  FOR EACH ROW EXECUTE FUNCTION notify_on_important_house_document();

REVOKE ALL ON FUNCTION notify_on_important_house_document() FROM PUBLIC;
