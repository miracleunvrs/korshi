-- Small request videos are accepted in the same private bucket; client limit stays 10 MiB.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg','image/png','image/webp','application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'video/mp4','video/webm','video/quicktime'
]::TEXT[]
WHERE id = 'house-media';
