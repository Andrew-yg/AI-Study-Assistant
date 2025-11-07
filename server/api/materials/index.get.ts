import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const userId = query.userId as string

    if (!userId) {
      throw createError({
        statusCode: 400,
        message: 'User ID is required'
      })
    }

    const { data, error } = await supabase
      .from('learning_materials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message
      })
    }

    return {
      success: true,
      data
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch materials'
    })
  }
})
