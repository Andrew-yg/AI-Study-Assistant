export interface PracticeQuizQuestion {
  id: string
  order: number
  question: string
  questionType: 'multiple_choice' | 'true_false' | 'short_answer'
  options: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  explanation: string
}

export interface PracticeQuizSubmissionAnswer {
  questionId: string
  userAnswer: string
  isCorrect: boolean
  feedback: string
  correctAnswer?: string
  score: number
}

export interface PracticeQuizSubmissionSummary {
  correct: number
  total: number
  score: number
}

export interface PracticeQuizSubmission {
  submittedAt: string
  summary: PracticeQuizSubmissionSummary
  answers: PracticeQuizSubmissionAnswer[]
}

export interface PracticeQuiz {
  id: string
  userId?: string
  conversationId: string | null
  materialIds: string[]
  questionType: PracticeQuizQuestion['questionType']
  difficulty: PracticeQuizQuestion['difficulty']
  count: number
  status: 'generated' | 'completed'
  materialSummary: string
  questions: PracticeQuizQuestion[]
  submissions: PracticeQuizSubmission[]
  createdAt?: string
  updatedAt?: string
}

export interface CreatePracticeQuizPayload {
  conversationId: string
  questionType: PracticeQuizQuestion['questionType']
  difficulty: PracticeQuizQuestion['difficulty']
  count: number
}

export interface SubmitPracticeQuizPayload {
  answers: Array<{ questionId: string; answer?: string }>
}

export const usePracticeQuiz = () => {
  const { token } = useAuth()

  const getHeaders = () => {
    if (!token.value) {
      throw new Error('Authentication required')
    }

    return {
      Authorization: `Bearer ${token.value}`,
    }
  }

  const fetchQuizzes = async (params: { conversationId?: string; limit?: number } = {}) => {
    const headers = getHeaders()
    const query: Record<string, string> = {}
    if (params.conversationId) {
      query.conversationId = params.conversationId
    }
    if (typeof params.limit === 'number') {
      query.limit = String(params.limit)
    }

    const { data } = await $fetch<{ data: PracticeQuiz[] }>('/api/practice-quizz', {
      headers,
      query,
    })
    return data
  }

  const fetchQuiz = async (quizId: string) => {
    const headers = getHeaders()
    const { data } = await $fetch<{ data: PracticeQuiz }>(`/api/practice-quizz/${quizId}`, {
      headers,
    })
    return data
  }

  const createQuiz = async (payload: CreatePracticeQuizPayload) => {
    const headers = getHeaders()
    const { data } = await $fetch<{ data: PracticeQuiz }>('/api/practice-quizz', {
      method: 'POST',
      headers,
      body: payload,
    })
    return data
  }

  const submitQuiz = async (quizId: string, payload: SubmitPracticeQuizPayload) => {
    const headers = getHeaders()
    const { data } = await $fetch<{ data: { quiz: PracticeQuiz; submission: { summary: PracticeQuizSubmissionSummary; answers: PracticeQuizSubmissionAnswer[] } } }>(
      `/api/practice-quizz/${quizId}/submit`,
      {
        method: 'POST',
        headers,
        body: payload,
      }
    )
    return data
  }

  return {
    fetchQuizzes,
    fetchQuiz,
    createQuiz,
    submitQuiz,
  }
}
