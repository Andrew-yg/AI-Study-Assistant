import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { findQuestionOrThrow } from '~/server/api/questions/getQuestion'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  await connectDB()

  const id = event.context.params?.id as string
  const question = await findQuestionOrThrow(id, userId)
  await question.deleteOne()

  return {
    success: true
  }
})
