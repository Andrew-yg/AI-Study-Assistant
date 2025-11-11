import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { Conversation } from '~/server/models/Conversation'
import { Message } from '~/server/models/Message'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)

  const body = await readBody(event)
  const { conversation_id, role, content } = body

  console.log('[API] Creating message for conversation:', conversation_id, 'user:', userId)

  await connectDB()

  try {
    // Verify conversation belongs to user
    const conversation = await Conversation.findOne({
      _id: conversation_id,
      userId
    })

    if (!conversation) {
      console.error('[API] Conversation not found:', conversation_id, 'for user:', userId)
      throw createError({
        statusCode: 404,
        message: 'Conversation not found'
      })
    }

    // Create message
    const message = await Message.create({
      conversationId: conversation_id,
      role,
      content
    })

    // Update conversation's updatedAt timestamp
    conversation.updatedAt = new Date()
    await conversation.save()

    console.log('[API] Message created successfully:', message._id)

    return {
      message: {
        id: message._id.toString(),
        conversationId: message.conversationId.toString(),
        role: message.role,
        content: message.content,
        createdAt: message.createdAt
      }
    }
  } catch (error: any) {
    console.error('[API] Failed to create message:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create message'
    })
  }
})

