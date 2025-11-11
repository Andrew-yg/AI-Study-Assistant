import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { Conversation } from '~/server/models/Conversation'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)

  console.log('[API] Fetching conversations for user:', userId)

  await connectDB()

  try {
    const conversations = await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .lean()

    console.log('[API] Found', conversations.length, 'conversations')

    // Transform MongoDB _id to id for frontend compatibility
    const transformedConversations = conversations.map(conv => ({
      id: conv._id.toString(),
      userId: conv.userId.toString(),
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    }))

    return { conversations: transformedConversations }
  } catch (error: any) {
    console.error('[API] Failed to fetch conversations:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch conversations'
    })
  }
})

