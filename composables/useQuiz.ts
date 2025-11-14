export interface QuizQuestion {
  id: string
  userId: string
  conversationId: string | null
  materialId: string
  question: string
  questionType: 'multiple_choice' | 'true_false' | 'short_answer'
  options: string[]
  correctAnswer: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  sourceSummary: string | null
  attempts: number
  correctAttempts: number
  createdAt: string
  updatedAt: string
}

export interface GenerateQuizPayload {
  materialId: string
  conversationId?: string
  questionType: QuizQuestion['questionType']
  difficulty: QuizQuestion['difficulty']
  count: number
}

export const useQuiz = () => {
  const { token } = useAuth()

  const getHeaders = () => {
    if (!token.value) {
      throw new Error('Authentication required')
    }

    return {
      Authorization: `Bearer ${token.value}`
    }
  }

  const fetchQuestions = async (params: { conversationId?: string; materialId?: string } = {}) => {
    const headers = getHeaders()
    const query: Record<string, string> = {}
    if (params.conversationId) {
      query.conversationId = params.conversationId
    }
    if (params.materialId) {
      query.materialId = params.materialId
    }

    const { data } = await $fetch<{ data: QuizQuestion[] }>('/api/questions', {
      headers,
      query
    })
    return data
  }

  const generateQuiz = async (payload: GenerateQuizPayload) => {
    const headers = getHeaders()
    const { data } = await $fetch<{ data: QuizQuestion[] }>('/api/questions', {
      method: 'POST',
      headers,
      body: payload
    })
    return data
  }

  const evaluateQuestion = async (questionId: string, answer: string) => {
    const headers = getHeaders()
    const { data } = await $fetch<{ data: { evaluation: { is_correct: boolean; score: number; feedback: string }; attempts: number; correctAttempts: number } }>(
      `/api/questions/${questionId}/evaluate`,
      {
        method: 'POST',
        headers,
        body: { answer }
      }
    )
    return data
  }

  const deleteQuestion = async (questionId: string) => {
    const headers = getHeaders()
    await $fetch(`/api/questions/${questionId}`, {
      method: 'DELETE',
      headers
    })
  }

  return {
    fetchQuestions,
    generateQuiz,
    evaluateQuestion,
    deleteQuestion
  }
}
