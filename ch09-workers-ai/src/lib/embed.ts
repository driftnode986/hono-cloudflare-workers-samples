// src/lib/embed.ts
// #region embed
export async function embed(ai: Ai, texts: string[]): Promise<number[][]> {
  const result = await ai.run('@cf/baai/bge-base-en-v1.5', { text: texts })
  if (!('data' in result) || !result.data) {
    throw new Error('埋め込みベクトルが返されませんでした')
  }
  return result.data
}
// #endregion
