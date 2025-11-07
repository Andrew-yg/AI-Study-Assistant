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

    const { data: material, error: fetchError } = await supabase
      .from('learning_materials')
      .select('file_path')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      throw createError({
        statusCode: 500,
        message: fetchError.message
      })
    }

    if (!material) {
      throw createError({
        statusCode: 404,
        message: 'Material not found'
      })
    }

    if (material.file_path) {
      const filePath = material.file_path.replace('learning-materials/', '')
      await supabase.storage
        .from('learning-materials')
        .remove([filePath])
    }

    const { error: deleteError } = await supabase
      .from('learning_materials')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw createError({
        statusCode: 500,
        message: deleteError.message
      })
    }

    return {
      success: true,
      message: 'Material deleted successfully'
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to delete material'
    })
  }
})
