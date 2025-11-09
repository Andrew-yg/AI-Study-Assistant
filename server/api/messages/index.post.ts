import { getAuthenticatedSupabase } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await getAuthenticatedSupabase(event)

  const body = await readBody(event)
  const { conversation_id, role, content } = body

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversation_id)
    .eq('user_id', user.id)
    .single()

  if (!conversation) {
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
    throw createError({
      statusCode: 500,
      message: 'Failed to create message'
    })
  }

  return { message }
})
