interface AgentHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

export interface AgentChatResponse {
  message: string
  tool_calls?: Array<Record<string, any>>
  metadata?: Record<string, any>
}

export interface AgentServicePayload {
  conversationId: string
  userId: string
  message: string
  history: AgentHistoryItem[]
  materialIds: string[]
}

export async function callAgentService(payload: AgentServicePayload): Promise<AgentChatResponse> {
  const config = useRuntimeConfig()

  if (!config.agentServiceUrl) {
    throw new Error('Agent service URL is not configured')
  }

  return await $fetch<AgentChatResponse>(`${config.agentServiceUrl}/chat`, {
    method: 'POST',
    body: {
      conversation_id: payload.conversationId,
      user_id: payload.userId,
      message: payload.message,
      history: payload.history,
      material_ids: payload.materialIds,
    }
  })
}
