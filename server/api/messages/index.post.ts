import { getAuthenticatedSupabase } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await getAuthenticatedSupabase(event)

  const body = await readBody(event)
  const { conversation_id, role, content } = body

  console.log('[API] Creating message for conversation:', conversation_id, 'user:', user.id)

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
    .eq('id', conversation_id)
    .eq('user_id', user.id)
    .single()

  if (!conversation) {
    console.error('[API] Conversation not found:', conversation_id, 'for user:', user.id)
    throw createError({
      statusCode: 404,
      message: 'Conversation not found'
    })
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id,
      role,
      content
    })
    .select()
    .single()

  if (error) {
    console.error('[API] Failed to create message:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw createError({
      statusCode: 500,
      message: `Failed to create message: ${error.message}`
    })
  }

  console.log('[API] Message created successfully:', message.id)

  return { message }
})
