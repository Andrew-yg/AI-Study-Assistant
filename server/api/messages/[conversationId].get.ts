import { getAuthenticatedSupabase } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await getAuthenticatedSupabase(event)

  const conversationId = getRouterParam(event, 'conversationId')

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!conversation) {
    throw createError({
      statusCode: 404,
      message: 'Conversation not found'
    })
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch messages'
    })
  }

  return { messages }
})
