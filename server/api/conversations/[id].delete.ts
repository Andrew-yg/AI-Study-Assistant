import { getAuthenticatedSupabase } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await getAuthenticatedSupabase(event)

  const conversationId = getRouterParam(event, 'id')

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to delete conversation'
    })
  }

  return { success: true }
})
