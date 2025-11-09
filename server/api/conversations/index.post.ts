import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[API] Missing or invalid authorization header')
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const token = authHeader.substring(7)

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    console.error('[API] Authentication failed:', authError?.message)
    throw createError({
      statusCode: 401,
      message: 'Invalid authentication token'
    })
  }

  const body = await readBody(event)
  const { title } = body

  console.log('[API] Creating conversation for user:', user.id, 'with title:', title || 'New Chat')

  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      title: title || 'New Chat'
    })
    .select()
    .single()

  if (error) {
    console.error('[API] Failed to create conversation:', error.message, error.details)
    throw createError({
      statusCode: 500,
      message: `Failed to create conversation: ${error.message}`
    })
  }

  console.log('[API] Conversation created successfully:', conversation.id)

  return { conversation }
})
