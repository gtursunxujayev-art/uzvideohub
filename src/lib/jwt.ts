// src/lib/jwt.ts
import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET as string

export function signSession(payload: object) {
  return jwt.sign(payload, secret, { expiresIn: '30d' })
}

export function verifySession<T = any>(token?: string | null): T | null {
  if (!token) return null
  try {
    return jwt.verify(token, secret) as T
  } catch {
    return null
  }
}
