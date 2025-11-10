import { getAuthenticatedSupabase } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await getAuthenticatedSupabase(event)

  const conversationId = getRouterParam(event, 'conversationId')

  console.log('[API] Fetching messages for conversation:', conversationId, 'user:', user.id)

  // Set the session for RLS to work properly
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.substring(7)
  
  if (token) {
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    })
  }

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!conversation) {
    console.error('[API] Conversation not found:', conversationId)
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
    console.error('[API] Failed to fetch messages:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch messages'
    })
  }

  console.log('[API] Found', messages?.length || 0, 'messages')

  return { messages }
})
