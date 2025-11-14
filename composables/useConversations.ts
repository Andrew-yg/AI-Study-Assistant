export interface Conversation {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export const useConversations = () => {
  const { token } = useAuth()

  const getAuthHeaders = () => {
    if (!token.value) {
      throw new Error('No authentication token available')
    }

    return {
      Authorization: `Bearer ${token.value}`
    }
  }

  const fetchConversations = async (): Promise<Conversation[]> => {
    const headers = getAuthHeaders()
    const { conversations } = await $fetch<{ conversations: Conversation[] }>(
      '/api/conversations',
      {
        headers
      }
    )
    return conversations
  }

  const createConversation = async (title: string = 'New Chat'): Promise<Conversation> => {
    try {
      const headers = getAuthHeaders()
      console.log('[useConversations] Creating conversation with title:', title)
      const { conversation } = await $fetch<{ conversation: Conversation }>(
        '/api/conversations',
        {
          method: 'POST',
          headers,
          body: { title }
        }
      )
      console.log('[useConversations] Conversation created successfully:', conversation.id)
      return conversation
    } catch (error: any) {
      console.error('[useConversations] Failed to create conversation:', error)
      throw error
    }
  }

  const updateConversation = async (id: string, title: string): Promise<Conversation> => {
    const headers = getAuthHeaders()
    const { conversation } = await $fetch<{ conversation: Conversation }>(
      `/api/conversations/${id}`,
      {
        method: 'PUT',
        headers,
        body: { title }
      }
    )
    return conversation
  }

  const deleteConversation = async (id: string): Promise<void> => {
    const headers = getAuthHeaders()
    await $fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
      headers
    })
  }

  const fetchMessages = async (conversationId: string): Promise<Message[]> => {
    const headers = getAuthHeaders()
    const { messages } = await $fetch<{ messages: Message[] }>(
      `/api/messages/${conversationId}`,
      {
        headers
      }
    )
    return messages
  }

  const sendMessage = async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<Message> => {
    const headers = getAuthHeaders()
    const { message } = await $fetch<{ message: Message }>(
      '/api/messages',
      {
        method: 'POST',
        headers,
        body: {
          conversation_id: conversationId,
          role,
          content
        }
      }
    )
    return message
  }

  return {
    fetchConversations,
    createConversation,
    updateConversation,
    deleteConversation,
    fetchMessages,
    sendMessage
  }
}
