import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { serializeQuestion } from '~/server/api/questions/serializer'
import { findQuestionOrThrow } from '~/server/api/questions/getQuestion'

const updateSchema = z.object({
  question: z.string().min(1).optional(),
  options: z.array(z.string().min(1)).optional(),
  correctAnswer: z.string().min(1).optional(),
  explanation: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.array(z.string().min(1)).optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
})

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  await connectDB()

  const id = event.context.params?.id as string
  const body = await readBody(event)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid request body', data: parsed.error.flatten() })
  }

  const question = await findQuestionOrThrow(id, userId)
  const updates = parsed.data

  if (typeof updates.question === 'string') {
    question.question = updates.question
  }
  if (updates.options) {
    question.options = updates.options
  }
  if (typeof updates.correctAnswer === 'string') {
    question.correctAnswer = updates.correctAnswer
  }
  if (typeof updates.explanation === 'string') {
    question.explanation = updates.explanation
  }
  if (updates.difficulty) {
    question.difficulty = updates.difficulty
  }
  if (updates.tags) {
    question.tags = updates.tags
  }

  await question.save()

  return {
    success: true,
    data: serializeQuestion(question)
  }
})
