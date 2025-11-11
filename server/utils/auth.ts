import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'
import { connectDB } from './mongodb'
import { User } from '../models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

/**
 * Generate JWT token for user
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email } as JWTPayload,
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

/**
 * Verify JWT token and return payload
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired token'
    })
  }
}

/**
 * Get authenticated user from request
 * This replaces getAuthenticatedSupabase
 */
export async function requireAuth(event: H3Event) {
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized - No token provided'
    })
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)

  // Connect to database
  await connectDB()

  // Get user from database
  const user = await User.findById(payload.userId)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'User not found'
    })
  }

  console.log('[Auth] Authenticated user:', user._id)

  return {
    userId: user._id!.toString(),
    user: {
      id: user._id!.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar
    }
  }
}
