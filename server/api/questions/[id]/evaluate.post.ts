import { z } from 'zod'

import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { findQuestionOrThrow } from '~/server/api/questions/getQuestion'

const bodySchema = z.object({
  answer: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  await connectDB()

  const id = event.context.params?.id as string
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid answer payload', data: parsed.error.flatten() })
  }

  const question = await findQuestionOrThrow(id, userId)

  const config = useRuntimeConfig()
  const quizServiceUrl = config.quizServiceUrl
  if (!quizServiceUrl) {
    throw createError({ statusCode: 500, message: 'Quiz service URL is not configured' })
  }

  const upstream = await fetch(`${quizServiceUrl}/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      question: question.question,
      question_type: question.questionType,
      user_answer: parsed.data.answer,
      correct_answer: question.correctAnswer,
      explanation: question.explanation,
      material_summary: question.sourceSummary
    })
  })

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => 'Quiz evaluation error')
    throw createError({ statusCode: 502, message: text })
  }

  const evaluation = await upstream.json()

  question.attempts = (question.attempts || 0) + 1
  if (evaluation.is_correct) {
    question.correctAttempts = (question.correctAttempts || 0) + 1
  }
  await question.save()

  return {
    success: true,
    data: {
      evaluation,
      attempts: question.attempts,
      correctAttempts: question.correctAttempts
    }
  }
})
