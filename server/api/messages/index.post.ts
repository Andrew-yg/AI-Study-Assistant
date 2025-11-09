import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const token = authHeader.substring(7)

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    throw createError({
      statusCode: 401,
      message: 'Invalid authentication token'
    })
  }

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
