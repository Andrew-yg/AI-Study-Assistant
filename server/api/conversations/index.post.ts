import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { Conversation } from '~/server/models/Conversation'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)

  const body = await readBody(event)
  const { title } = body

  console.log('[API] Creating conversation for user:', userId, 'with title:', title || 'New Chat')

  await connectDB()

  try {
    const conversation = await Conversation.create({
      userId,
      title: title || 'New Chat'
    })

    console.log('[API] Conversation created successfully:', conversation._id)

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
    console.error('[API] Failed to create conversation:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create conversation'
    })
  }
})

