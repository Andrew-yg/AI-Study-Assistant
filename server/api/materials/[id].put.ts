import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Material ID is required'
      })
    }

    const { courseName, materialType, description } = body

    const updates: any = {}
    if (courseName !== undefined) updates.course_name = courseName
    if (materialType !== undefined) updates.material_type = materialType
    if (description !== undefined) updates.description = description

    if (Object.keys(updates).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No fields to update'
      })
    }

    const { data, error } = await supabase
      .from('learning_materials')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

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
      message: error.message || 'Failed to update material'
    })
  }
})
