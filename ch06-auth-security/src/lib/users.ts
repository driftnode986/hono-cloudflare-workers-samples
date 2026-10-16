// src/lib/users.ts
// 本文の findUserByEmail の実体 (users テーブルをメールアドレスで引く)
export type User = {
  id: string
  passwordHash: string
  role: string
}

export const findUserByEmail = async (
  db: D1Database,
  email: string
): Promise<User | null> => {
  return db
    .prepare(
      `SELECT id, password_hash AS passwordHash, role
       FROM users WHERE email = ?`
    )
    .bind(email)
    .first<User>()
}
