// src/lib/image.ts
// #region decode-image
export function decodeImage(result: { image?: string }): Uint8Array {
  if (!result.image) {
    throw new Error('画像データが返されませんでした')
  }
  const binary = atob(result.image)
  return Uint8Array.from(binary, (ch) => ch.codePointAt(0) ?? 0)
}
// #endregion
