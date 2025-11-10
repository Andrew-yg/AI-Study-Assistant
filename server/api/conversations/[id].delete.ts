import { getAuthenticatedSupabase } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await getAuthenticatedSupabase(event)

  const conversationId = getRouterParam(event, 'id')

  console.log('[API] Deleting conversation:', conversationId, 'for user:', user.id)

  // Set the session for RLS to work properly
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.substring(7)
  
  if (token) {
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    })
  }

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[API] Failed to delete conversation:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete conversation'
    })
  }

  console.log('[API] Conversation deleted successfully')

  return { success: true }
})
