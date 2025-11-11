import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { LearningMaterial } from '~/server/models/LearningMaterial'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)

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
  if (courseName !== undefined) updates.courseName = courseName
  if (materialType !== undefined) updates.materialType = materialType
  if (description !== undefined) updates.description = description

  if (Object.keys(updates).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No fields to update'
    })
  }

  await connectDB()

  try {
    const material = await LearningMaterial.findOneAndUpdate(
      { _id: id, userId },
      updates,
      { new: true }
    )

    if (!material) {
      throw createError({
        statusCode: 404,
        message: 'Material not found'
      })
    }

    return {
      success: true,
      data: {
        id: material._id.toString(),
        userId: material.userId.toString(),
        conversationId: material.conversationId?.toString() || null,
        courseName: material.courseName,
        materialType: material.materialType,
        description: material.description,
        filePath: material.filePath,
        fileSize: material.fileSize,
        originalFilename: material.originalFilename,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update material'
    })
  }
})

