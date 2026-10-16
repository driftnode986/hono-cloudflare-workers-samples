// src/lib/password.ts
// #region hash-key
export const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )
// #endregion

// #region hash-encode
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const hashHex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return `${saltHex}:${hashHex}`
}
// #endregion

// #region verify-key
export const verifyPassword = async (
  password: string,
  stored: string
): Promise<boolean> => {
  const [saltHex, expectedHashHex] = stored.split(':')
  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
  )

  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )

// #endregion

// #region verify-compare
  // 定数時間で比較する (Workers 独自の crypto.subtle.timingSafeEqual)
  const expected = new Uint8Array(
    expectedHashHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
  )
  if (expected.byteLength !== hash.byteLength) {
    return false
  }

  return crypto.subtle.timingSafeEqual(hash, expected)
}
// #endregion
