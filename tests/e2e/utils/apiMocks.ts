import type { Page, Route } from '@playwright/test'

interface ConversationFixture {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
}

interface MessageFixture {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface MaterialFixture {
  id: string
  conversationId: string | null
  courseName: string
  materialType: string
  description: string
  fileSize: number
  originalFilename: string
  createdAt: string
}

interface PracticeQuizFixture {
  id: string
  questionType: 'multiple_choice' | 'true_false' | 'short_answer'
  difficulty: 'easy' | 'medium' | 'hard'
  count: number
  status: 'generated' | 'completed'
  updatedAt: string
}

interface ChatMocksOptions {
  assistantMessage: string
}

const conversationId = '64f4b5ec9da9016a4c123456'
const now = new Date().toISOString()

const conversations: ConversationFixture[] = [
  {
    id: conversationId,
    userId: 'user-123',
    title: 'Biology Review',
    createdAt: now,
    updatedAt: now,
  },
]

const initialMessages: MessageFixture[] = [
  {
    id: 'msg-initial-assistant',
    conversationId,
    role: 'assistant',
    content: 'Hi! I highlighted the key photosynthesis concepts from your lecture notes.',
    createdAt: now,
  },
]

const materials: MaterialFixture[] = [
  {
    id: 'mat-101',
    conversationId,
    courseName: 'Biology 101',
    materialType: 'pdf',
    description: 'Lecture Slides Week 3',
    fileSize: 1_024_000,
    originalFilename: 'photosynthesis.pdf',
    createdAt: now,
  },
]

const quizzes: PracticeQuizFixture[] = [
  {
    id: 'quiz-01',
    questionType: 'multiple_choice',
    difficulty: 'medium',
    count: 5,
    status: 'generated',
    updatedAt: now,
  },
]

export async function seedAuthState(page: Page, token: string) {
  await page.addInitScript((storedToken) => {
    window.localStorage.setItem('auth_token', storedToken)
  }, token)
}

export async function mockChatApis(page: Page, options: ChatMocksOptions) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        user: {
          id: 'user-123',
          email: 'student@example.com',
          name: 'Playwright Student',
        },
      }),
    }),
  )

  await page.route('**/api/conversations', (route) => handleConversationRoute(route))
  await page.route(`**/api/messages/${conversationId}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ messages: initialMessages }),
    }),
  )

  await page.route('**/api/materials*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: materials }),
    }),
  )

  await page.route('**/api/practice-quizz*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: quizzes.map((quiz) => ({
          id: quiz.id,
          userId: 'user-123',
          conversationId,
          materialIds: [materials[0].id],
          questionType: quiz.questionType,
          difficulty: quiz.difficulty,
          count: quiz.count,
          status: quiz.status,
          materialSummary: 'Chloroplasts convert light energy into sugars.',
          questions: [],
          submissions: [],
          createdAt: now,
          updatedAt: quiz.updatedAt,
        })),
      }),
    }),
  )

  await page.route('**/api/agent/chat', (route) =>
    route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
      body: buildSseStream(options.assistantMessage),
    }),
  )
}

function handleConversationRoute(route: Route) {
  if (route.request().method() === 'GET') {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ conversations }),
    })
  }

  if (route.request().method() === 'POST') {
    const body = route.request().postDataJSON() as { title?: string }
    const newConversation: ConversationFixture = {
      id: 'conv-new',
      userId: 'user-123',
      title: body.title || 'New Chat',
      createdAt: now,
      updatedAt: now,
    }
    conversations.unshift(newConversation)
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ conversation: newConversation }),
    })
  }

  return route.fulfill({
    status: 405,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Method not mocked' }),
  })
}

function buildSseStream(assistantMessage: string) {
  const assistantId = 'msg-assistant-latest'
  const userId = 'msg-user-latest'
  const telemetry = {
    model: 'gpt-4o-mini',
    rag_sources: [
      {
        snippet: 'Photosynthesis happens inside the chloroplast and produces glucose.',
        score: 0.91,
        metadata: { filename: 'photosynthesis.pdf' },
      },
    ],
    web_results: [],
  }

  const events = [
    {
      event: 'user',
      data: {
        id: userId,
        conversationId,
        role: 'user',
        content: 'Explain photosynthesis?',
        createdAt: now,
      },
    },
    {
      event: 'token',
      data: { delta: assistantMessage.slice(0, 42) },
    },
    {
      event: 'assistant',
      data: {
        id: assistantId,
        conversationId,
        role: 'assistant',
        content: assistantMessage,
        createdAt: now,
      },
    },
    {
      event: 'metadata',
      data: {
        messageId: assistantId,
        metadata: telemetry,
        toolCalls: [
          {
            name: 'rag_query',
            status: 'success',
            detail: { materials: 1, sources: 1 },
          },
        ],
      },
    },
    {
      event: 'done',
      data: { success: true },
    },
  ]

  return events
    .map((entry) => `event: ${entry.event}\ndata: ${JSON.stringify(entry.data)}\n\n`)
    .join('')
}

export const chatTestFixtures = {
  conversationId,
}
