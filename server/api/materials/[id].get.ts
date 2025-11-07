import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Material ID is required'
      })
    }

    const { data, error } = await supabase
      .from('learning_materials')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message
      })
    }

    if (!data) {
      throw createError({
        statusCode: 404,
        message: 'Material not found'
      })
    }

    return {
      success: true,
      data
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch material'
    })
  }
})
