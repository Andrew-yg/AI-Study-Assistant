import type { H3Event } from 'h3'
import jwt from 'jsonwebtoken'
import { connectDB } from '../utils/mongodb'

export interface GraphQLContext {
    userId: string
    event: H3Event
}

export async function createContext(event: H3Event): Promise<GraphQLContext> {
    const config = useRuntimeConfig()

    // Extract token from Authorization header
    const authHeader = getHeader(event, 'authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Unauthorized: No token provided')
    }

    const token = authHeader.substring(7)

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, config.jwtSecret) as { userId: string }

        // Connect to MongoDB
        await connectDB()

        return {
            userId: decoded.userId,
            event
        }
    } catch (error) {
        throw new Error('Unauthorized: Invalid token')
    }
}
