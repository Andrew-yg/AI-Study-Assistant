import { getMethod, setHeaders } from 'h3'

import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { Conversation } from '~/server/models/Conversation'
import { Message } from '~/server/models/Message'
import { LearningMaterial } from '~/server/models/LearningMaterial'
import { ensureServiceHealthy } from '~/server/utils/serviceHealth'

interface AgentChatBody {
  conversationId?: string
  message?: string
}

const HISTORY_LIMIT = 15

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  const { userId } = await requireAuth(event)
  const body = await readBody<AgentChatBody>(event)

  if (!body.conversationId) {
    throw createError({ statusCode: 400, message: 'conversationId is required' })
  }

  if (!body.message?.trim()) {
    throw createError({ statusCode: 400, message: 'message is required' })
  }

  const config = useRuntimeConfig()
  if (!config.agentServiceUrl) {
    throw createError({ statusCode: 500, message: 'Agent service URL missing' })
  }

  setHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })
  event.node.res.flushHeaders?.()

  const sendEvent = (name: string, payload: any) => {
    if (event.node.res.writableEnded) {
      return
    }
    event.node.res.write(`event: ${name}\n`)
    event.node.res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }

  const serializeMessage = (msg: any) => ({
    id: msg._id.toString(),
    conversationId: msg.conversationId.toString(),
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
  })

  const trimmedMessage = body.message.trim()

  try {
    await connectDB()

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

    sendEvent('user', serializeMessage(userMessage))

    const materialDocs = await LearningMaterial.find({
      conversationId: conversation._id,
      userId,
      processingStatus: 'processed',
    })
      .select('_id')
      .lean()

    const materialIds = materialDocs.map(doc => doc._id.toString())

  await ensureServiceHealthy('agent')

  const upstreamResponse = await fetch(`${config.agentServiceUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversation._id.toString(),
        user_id: userId,
        message: trimmedMessage,
        history,
        material_ids: materialIds,
      }),
    })

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      throw createError({ statusCode: 502, message: 'Agent service failed to respond' })
    }

    const reader = upstreamResponse.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let assistantText = ''
    let metadataPayload: any = null

    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }
      buffer += decoder.decode(value, { stream: true })
      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        const parsed = parseSseEvent(rawEvent)
        if (parsed && parsed.event === 'token') {
          const delta = parsed.data?.delta || ''
          assistantText += delta
          sendEvent('token', { delta })
        } else if (parsed && parsed.event === 'metadata') {
          metadataPayload = parsed.data
        }
        boundary = buffer.indexOf('\n\n')
      }
    }

    if (buffer.trim().length) {
      const parsed = parseSseEvent(buffer)
      if (parsed && parsed.event === 'metadata') {
        metadataPayload = parsed.data
      }
    }

    const finalContent = metadataPayload?.message || assistantText

    const assistantMessage = await Message.create({
      conversationId: conversation._id,
      role: 'assistant',
      content: finalContent,
    })

    conversation.updatedAt = new Date()
    await conversation.save()

    const serializedAssistant = serializeMessage(assistantMessage)
    sendEvent('assistant', serializedAssistant)

    if (metadataPayload) {
      sendEvent('metadata', {
        messageId: serializedAssistant.id,
        metadata: metadataPayload.metadata || {},
        toolCalls: metadataPayload.tool_calls || [],
      })
    }

    sendEvent('done', { success: true })
    event.node.res.end()
    return
  } catch (error: any) {
    const status = error?.statusCode || 500
    const message = error?.message || 'Agent stream failed'
    console.error('[API] Agent streaming error:', error)
    sendEvent('error', { status, message })
    event.node.res.end()
    if (error?.statusCode) {
      return
    }
  }
})

function parseSseEvent(raw: string) {
  if (!raw) {
    return null
  }

  let eventName = 'message'
  const dataLines: string[] = []

  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    }
  }

  const dataString = dataLines.join('\n')
  let parsedData: any = null
  if (dataString) {
    try {
      parsedData = JSON.parse(dataString)
    } catch (err) {
      parsedData = { raw: dataString }
    }
  }

  return {
    event: eventName,
    data: parsedData,
  }
}
