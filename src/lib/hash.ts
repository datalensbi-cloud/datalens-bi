/**
 * SHA-256 hash of a file's bytes, using browser-native WebCrypto.
 * Used for per-user duplicate detection on upload.
 *
 * Performance: ~2s on 25 MB file on a modern laptop. Acceptable
 * because hashing happens once, before upload, in the user's browser.
 */
export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
