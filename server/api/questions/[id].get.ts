import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { serializeQuestion } from '~/server/api/questions/serializer'
import { findQuestionOrThrow } from '~/server/api/questions/getQuestion'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  await connectDB()

  const id = event.context.params?.id as string
  const question = await findQuestionOrThrow(id, userId)

  return {
    success: true,
    data: serializeQuestion(question)
  }
})
