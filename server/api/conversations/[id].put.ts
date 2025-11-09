import { getAuthenticatedSupabase } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await getAuthenticatedSupabase(event)

  const conversationId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { title } = body

  const { data: conversation, error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to update conversation'
    })
  }

  return { conversation }
})
