import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { LearningMaterial } from '~/server/models/LearningMaterial'
import { deleteFromR2 } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Material ID is required'
    })
  }

  await connectDB()

  try {
    const material = await LearningMaterial.findOne({ _id: id, userId })

    if (!material) {
      throw createError({
        statusCode: 404,
        message: 'Material not found'
      })
    }

    // Delete file from R2
    if (material.filePath) {
      try {
        await deleteFromR2(material.filePath)
      } catch (error) {
        console.error('[Delete] Failed to delete file from R2:', error)
        // Continue anyway - we still want to delete the DB record
      }
    }

    // Delete from database
    await LearningMaterial.findByIdAndDelete(id)

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

