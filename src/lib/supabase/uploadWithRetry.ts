/** Retries transient Storage failures while keeping the same idempotent path. */
export async function uploadWithRetry<T>(
  upload: () => PromiseLike<{ data: T; error: null } | { data: null; error: Error }>,
  maxAttempts = 3,
) {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await upload();
    if (!result.error) return result.data;
    lastError = result.error;
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** (attempt - 1)));
    }
  }
  throw lastError || new Error("Не удалось загрузить файл");
}
