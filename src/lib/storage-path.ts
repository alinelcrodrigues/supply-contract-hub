/**
 * Creates an ASCII-only object name accepted by the storage API while the
 * original file name remains available in the document metadata.
 */
export function createStorageObjectName(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  const rawBase = lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
  const rawExtension = lastDot > 0 ? fileName.slice(lastDot + 1) : "";

  const base = rawBase
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "arquivo";
  const extension = rawExtension.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
  const uniquePart = globalThis.crypto.randomUUID();

  return `${Date.now()}-${uniquePart}-${base}${extension ? `.${extension}` : ""}`;
}

export function createStoragePath(parentId: string, fileName: string) {
  return `${parentId}/${createStorageObjectName(fileName)}`;
}