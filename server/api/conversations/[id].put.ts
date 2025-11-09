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
