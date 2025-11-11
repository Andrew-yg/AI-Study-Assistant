import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { Conversation } from '~/server/models/Conversation'
import { Message } from '~/server/models/Message'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)

  const conversationId = getRouterParam(event, 'id')

  console.log('[API] Deleting conversation:', conversationId, 'for user:', userId)

  await connectDB()

  try {
    // Delete conversation (MongoDB won't cascade delete, so we do it manually)
    const conversation = await Conversation.findOneAndDelete({
      _id: conversationId,
      userId
    })

    if (!conversation) {
      throw createError({
        statusCode: 404,
        message: 'Conversation not found'
      })
    }

    // Delete all messages in this conversation
    await Message.deleteMany({ conversationId })

    console.log('[API] Conversation deleted successfully')

    return { success: true }
  } catch (error: any) {
    console.error('[API] Failed to delete conversation:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete conversation'
    })
  }
})

