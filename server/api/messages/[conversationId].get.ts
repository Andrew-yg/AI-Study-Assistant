import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { Conversation } from '~/server/models/Conversation'
import { Message } from '~/server/models/Message'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)

  const conversationId = getRouterParam(event, 'conversationId')

  console.log('[API] Fetching messages for conversation:', conversationId, 'user:', userId)

  await connectDB()

  try {
    // Verify conversation belongs to user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId
    })

    if (!conversation) {
      console.error('[API] Conversation not found:', conversationId)
      throw createError({
        statusCode: 404,
        message: 'Conversation not found'
      })
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean()

    console.log('[API] Found', messages.length, 'messages')

    // Transform for frontend
    const transformedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt
    }))

    return { messages: transformedMessages }
  } catch (error: any) {
    console.error('[API] Failed to fetch messages:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch messages'
    })
  }
})

