export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const IMAGE_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const DOCUMENT_UPLOAD_TYPES = [...IMAGE_UPLOAD_TYPES, "application/pdf"] as const;

export function validateUploadFile(
  file: File,
  allowedTypes: readonly string[] = DOCUMENT_UPLOAD_TYPES,
): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Размер файла не должен превышать 10 МБ";
  }
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return "Поддерживаются только JPG, PNG, WEBP и PDF";
  }
  return null;
}
