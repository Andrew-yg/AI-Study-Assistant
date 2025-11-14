import mongoose from 'mongoose'
import { z } from 'zod'

import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { PracticeQuiz } from '~/server/models/PracticeQuiz'
import { serializePracticeQuiz } from '~/server/api/practice-quizz/serializer'

const bodySchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string().optional(),
    })
  ).min(1),
})

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  await connectDB()

  const quizId = event.context.params?.id
  if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
    throw createError({ statusCode: 400, message: 'Invalid quiz id' })
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid request body', data: parsed.error.flatten() })
  }

  const quiz = await PracticeQuiz.findOne({
    _id: new mongoose.Types.ObjectId(quizId),
    userId,
  })

  if (!quiz) {
    throw createError({ statusCode: 404, message: 'Quiz not found' })
  }

  const answerMap = new Map(parsed.data.answers.map((entry) => [entry.questionId, entry.answer ?? '']))

  const config = useRuntimeConfig()
  const quizServiceUrl = config.quizServiceUrl
  if (!quizServiceUrl) {
    throw createError({ statusCode: 500, message: 'Quiz service URL is not configured' })
  }

  const evaluationResults: Array<{
    questionId: string
    userAnswer: string
    isCorrect: boolean
    score: number
    feedback: string
    correctAnswer: string
  }> = []

  for (const question of quiz.questions) {
    const questionId = question._id?.toString() || ''
    const userAnswer = (answerMap.get(questionId) || '').trim()

    if (!userAnswer) {
      evaluationResults.push({
        questionId,
        userAnswer: '',
        isCorrect: false,
        score: 0,
        feedback: 'No answer provided.',
        correctAnswer: question.correctAnswer,
      })
      continue
    }

    const upstreamResponse = await fetch(`${quizServiceUrl}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question.question,
        question_type: question.questionType,
        user_answer: userAnswer,
        correct_answer: question.correctAnswer,
        explanation: question.explanation,
        material_summary: quiz.materialSummary,
      }),
    })

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text().catch(() => 'Quiz evaluation error')
      throw createError({ statusCode: 502, message: errorText })
    }

    const evaluation = await upstreamResponse.json()
    evaluationResults.push({
      questionId,
      userAnswer,
      isCorrect: Boolean(evaluation.is_correct),
      score: Number(evaluation.score || 0),
      feedback: evaluation.feedback || '',
      correctAnswer: question.correctAnswer,
    })
  }

  const correctCount = evaluationResults.filter((entry) => entry.isCorrect).length
  const total = quiz.questions.length || 1
  const score = Number((correctCount / total).toFixed(2))

  quiz.status = 'completed'
  quiz.submissions.push({
    submittedAt: new Date(),
    summary: {
      correct: correctCount,
      total,
      score,
    },
    answers: evaluationResults.map((entry) => ({
      questionId: new mongoose.Types.ObjectId(entry.questionId),
      userAnswer: entry.userAnswer,
      isCorrect: entry.isCorrect,
      feedback: entry.feedback,
      score: entry.score,
      correctAnswer: entry.correctAnswer,
    })),
  })

  await quiz.save()

  return {
    success: true,
    data: {
      quiz: serializePracticeQuiz(quiz),
      submission: {
        summary: {
          correct: correctCount,
          total,
          score,
        },
        answers: evaluationResults,
      },
    },
  }
})
