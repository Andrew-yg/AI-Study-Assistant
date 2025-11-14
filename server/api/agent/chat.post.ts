import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { Conversation } from '~/server/models/Conversation'
import { Message } from '~/server/models/Message'
import { LearningMaterial } from '~/server/models/LearningMaterial'
import { callAgentService } from '~/server/utils/agent'

interface AgentChatBody {
  conversationId?: string
  message?: string
}

const HISTORY_LIMIT = 15

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  const body = await readBody<AgentChatBody>(event)

  if (!body.conversationId) {
    throw createError({ statusCode: 400, message: 'conversationId is required' })
  }

  if (!body.message?.trim()) {
    throw createError({ statusCode: 400, message: 'message is required' })
  }

  await connectDB()
  const trimmedMessage = body.message.trim()

  try {
    const conversation = await Conversation.findOne({
      _id: body.conversationId,
      userId,
    })

    if (!conversation) {
      throw createError({ statusCode: 404, message: 'Conversation not found' })
    }

    const historyDocs = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT)
      .lean()

    const history = historyDocs
      .reverse()
      .map(msg => ({ role: msg.role, content: msg.content }))

    const userMessage = await Message.create({
      conversationId: conversation._id,
      role: 'user',
      content: trimmedMessage,
    })

    const materialDocs = await LearningMaterial.find({
      conversationId: conversation._id,
      userId,
      processingStatus: 'processed',
    })
      .select('_id')
      .lean()

    const materialIds = materialDocs.map(doc => doc._id.toString())

    let agentResponse
    try {
      agentResponse = await callAgentService({
        conversationId: conversation._id.toString(),
        userId,
        message: trimmedMessage,
        history,
        materialIds,
      })
    } catch (error: any) {
      console.error('[API] Agent service error:', error)
      throw createError({
        statusCode: 502,
        message: 'Agent service is currently unavailable',
      })
    }

    const assistantMessage = await Message.create({
      conversationId: conversation._id,
      role: 'assistant',
      content: agentResponse.message,
    })

    conversation.updatedAt = new Date()
    await conversation.save()

    const serializeMessage = (msg: any) => ({
      id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
    })

    return {
      success: true,
      userMessage: serializeMessage(userMessage),
      assistantMessage: serializeMessage(assistantMessage),
      metadata: agentResponse.metadata || {},
      toolCalls: agentResponse.tool_calls || [],
    }
  } catch (error: any) {
    if (error?.statusCode) {
      throw error
    }
    console.error('[API] Failed to complete agent chat:', error)
    throw createError({ statusCode: 500, message: 'Failed to send message' })
  }
})
