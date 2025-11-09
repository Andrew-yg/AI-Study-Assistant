import { getAuthenticatedSupabase } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await getAuthenticatedSupabase(event)

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
    console.error('[API] Failed to create conversation:', error.message, error.details, error.hint)
    throw createError({
      statusCode: 500,
      message: `Failed to create conversation: ${error.message}`
    })
  }

  console.log('[API] Conversation created successfully:', conversation.id)

  return { conversation }
})
