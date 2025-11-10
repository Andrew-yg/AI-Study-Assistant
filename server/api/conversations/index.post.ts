import { getAuthenticatedSupabase } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await getAuthenticatedSupabase(event)

  const body = await readBody(event)
  const { title } = body

  console.log('[API] Creating conversation for user:', user.id, 'with title:', title || 'New Chat')

  // Set the session for RLS to work properly
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.substring(7)
  
  if (token) {
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    })
  }

  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      title: title || 'New Chat'
    })
    .select()
    .single()

  if (error) {
    console.error('[API] Failed to create conversation:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw createError({
      statusCode: 500,
      message: `Failed to create conversation: ${error.message}`
    })
  }

  console.log('[API] Conversation created successfully:', conversation.id)

  return { conversation }
})
