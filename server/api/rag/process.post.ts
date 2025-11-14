import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { LearningMaterial } from '~/server/models/LearningMaterial'
import { downloadFromR2 } from '~/server/utils/r2'
import { processMaterialWithRag } from '~/server/utils/rag'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  const body = await readBody<{ materialId?: string }>(event)

  if (!body?.materialId) {
    throw createError({ statusCode: 400, message: 'materialId is required' })
  }

  await connectDB()
  const material = await LearningMaterial.findById(body.materialId)

  if (!material) {
    throw createError({ statusCode: 404, message: 'Learning material not found' })
  }

  if (material.userId.toString() !== userId) {
    throw createError({ statusCode: 403, message: 'You do not have access to this material' })
  }

  const fileBuffer = await downloadFromR2(material.filePath)

  await LearningMaterial.findByIdAndUpdate(material._id, {
    processingStatus: 'processing',
    processingError: null,
  })

  try {
    const ragResponse = await processMaterialWithRag(material.toObject(), fileBuffer)

    await LearningMaterial.findByIdAndUpdate(material._id, {
      processingStatus: 'processed',
      processedAt: new Date(),
      vectorDocumentCount: ragResponse.documents,
    })

    return {
      success: true,
      materialId: material._id.toString(),
      rag: ragResponse,
    }
  } catch (error: any) {
    await LearningMaterial.findByIdAndUpdate(material._id, {
      processingStatus: 'failed',
      processingError: error.message || 'RAG processing failed',
    })

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to process material with RAG',
    })
  }
})
