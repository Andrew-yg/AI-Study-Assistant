import { getAuthenticatedSupabase } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await getAuthenticatedSupabase(event)

  console.log('[API] Fetching conversations for user:', user.id)

  // Set the session for RLS to work properly
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.substring(7)
  
  if (token) {
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    })
  }

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[API] Failed to fetch conversations:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch conversations'
    })
  }

  console.log('[API] Found', conversations?.length || 0, 'conversations')

  return { conversations }
})
