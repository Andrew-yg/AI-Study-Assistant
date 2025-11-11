import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { Conversation } from '~/server/models/Conversation'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)

  const conversationId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { title } = body

  console.log('[API] Updating conversation:', conversationId, 'for user:', userId)

  await connectDB()

  try {
    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, userId },
      { title },
      { new: true }
    )

    if (!conversation) {
      throw createError({
        statusCode: 404,
        message: 'Conversation not found'
      })
    }

    console.log('[API] Conversation updated successfully')

    return {
      conversation: {
        id: conversation._id.toString(),
        userId: conversation.userId.toString(),
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    }
  } catch (error: any) {
    console.error('[API] Failed to update conversation:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update conversation'
    })
  }
})

