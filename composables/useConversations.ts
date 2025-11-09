import { useSupabaseClient } from '~/utils/supabase'

export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export const useConversations = () => {
  const supabase = useSupabaseClient()

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    return {
      Authorization: `Bearer ${session.access_token}`
    }
  }

  const fetchConversations = async (): Promise<Conversation[]> => {
    const headers = await getAuthHeaders()
    const { conversations } = await $fetch<{ conversations: Conversation[] }>(
      '/api/conversations',
      {
        headers
      }
    )
    return conversations
  }

  const createConversation = async (title: string = 'New Chat'): Promise<Conversation> => {
    const headers = await getAuthHeaders()
    const { conversation } = await $fetch<{ conversation: Conversation }>(
      '/api/conversations',
      {
        method: 'POST',
        headers,
        body: { title }
      }
    )
    return conversation
  }

  const updateConversation = async (id: string, title: string): Promise<Conversation> => {
    const headers = await getAuthHeaders()
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
    const headers = await getAuthHeaders()
    await $fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
      headers
    })
  }

  const fetchMessages = async (conversationId: string): Promise<Message[]> => {
    const headers = await getAuthHeaders()
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
    const headers = await getAuthHeaders()
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
