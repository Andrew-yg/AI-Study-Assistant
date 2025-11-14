import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { LearningMaterial } from '~/server/models/LearningMaterial'
import { queryRag } from '~/server/utils/rag'

interface RagQueryBody {
  question?: string
  materialIds?: string[]
  topK?: number
}

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  const body = await readBody<RagQueryBody>(event)

  if (!body.question?.trim()) {
    throw createError({ statusCode: 400, message: 'question is required' })
  }

  await connectDB()

  if (body.materialIds?.length) {
    const materials = await LearningMaterial.find({
      _id: { $in: body.materialIds },
      userId,
    })

    if (materials.length !== body.materialIds.length) {
      throw createError({ statusCode: 403, message: 'One or more materials are not accessible' })
    }
  }

  const response = await queryRag({
    question: body.question,
    userId,
    materialIds: body.materialIds,
    topK: body.topK,
  })

  return {
    success: true,
    data: response,
  }
})
