import { getAuthenticatedSupabase } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await getAuthenticatedSupabase(event)

  const conversationId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { title } = body

  console.log('[API] Updating conversation:', conversationId, 'for user:', user.id)

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
    .update({ title })
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('[API] Failed to update conversation:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update conversation'
    })
  }

  console.log('[API] Conversation updated successfully')

  return { conversation }
})
