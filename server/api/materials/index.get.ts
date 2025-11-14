import mongoose from 'mongoose'
import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { LearningMaterial } from '~/server/models/LearningMaterial'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)

  await connectDB()

  try {
    const query = getQuery(event)
    const conversationIdParam = typeof query.conversationId === 'string'
      ? query.conversationId.trim()
      : undefined

    const filter: Record<string, any> = { userId }

    if (conversationIdParam && conversationIdParam !== 'all') {
      if (['none', 'null', 'unassigned', ''].includes(conversationIdParam)) {
        filter.$or = [{ conversationId: { $exists: false } }, { conversationId: null }]
      } else {
        if (!mongoose.Types.ObjectId.isValid(conversationIdParam)) {
          throw createError({
            statusCode: 400,
            message: 'Invalid conversationId'
          })
        }
        filter.conversationId = new mongoose.Types.ObjectId(conversationIdParam)
      }
    }

    const materials = await LearningMaterial.find(filter)
      .sort({ createdAt: -1 })
      .lean()

    const transformedMaterials = materials.map(mat => ({
      id: mat._id.toString(),
      userId: mat.userId.toString(),
      conversationId: mat.conversationId?.toString() || null,
      courseName: mat.courseName,
      materialType: mat.materialType,
      description: mat.description,
      filePath: mat.filePath,
      fileSize: mat.fileSize,
      originalFilename: mat.originalFilename,
      createdAt: mat.createdAt,
      updatedAt: mat.updatedAt
    }))

    return {
      success: true,
      data: transformedMaterials
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch materials'
    })
  }
})

