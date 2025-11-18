<template>
  <div class="chat-page">
    <!-- Mobile sidebar overlay -->
    <div v-if="showMobileSidebar" class="mobile-sidebar-overlay" @click="showMobileSidebar = false"></div>
    
    <Sidebar
      :class="{ 'mobile-open': showMobileSidebar }"
      :sessions="chatSessions"
      :current-session-id="currentSessionId"
      @new-chat="createNewChat"
      @select-session="selectSession"
      @delete-session="deleteSession"
      @rename-session="renameSession"
    />

    <div class="main-content">
      <div class="user-header">
        <button class="mobile-menu-button" @click="showMobileSidebar = !showMobileSidebar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <button class="user-button" @click="showUserMenu = !showUserMenu">
          <div class="user-avatar">{{ userInitials }}</div>
          <span class="user-name">{{ userName }}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div v-if="showUserMenu" class="user-menu">
          <div class="user-menu-item" @click="handleLogout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sign Out
          </div>
        </div>
      </div>
      <div class="chat-container">
        <div class="chat-scroll-region" ref="messagesContainer">
          <div v-if="messages.length === 0" class="empty-state">
            <div class="empty-icon">⚡️</div>
            <h2>How can I help you today?</h2>
            <p>Upload your lecture notes and start asking questions or generate practice quizzes</p>
          </div>
          <div v-else class="messages-container">
                <div
                  v-for="message in messages"
                  :key="message.id"
                  :class="['message-entry', message.role]"
                >
                  <div class="message-avatar">
                    <span v-if="message.role === 'user'">{{ userInitials }}</span>
                    <div v-else class="assistant-avatar">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 12a5 5 0 100-10 5 5 0 000 10z" />
                        <path d="M2 22a10 10 0 0120 0" />
                      </svg>
                    </div>
                  </div>
                  <div class="message-body">
                    <div class="message-header">
                      <div class="message-author">
                        <span class="message-role">{{ message.role === 'user' ? userName : 'StudyBuddy' }}</span>
                        <span class="message-timestamp">{{ formatTimestamp(message.createdAt) }}</span>
                      </div>
                      <div
                        v-if="message.role === 'assistant' && streamingAssistantId === message.id"
                        class="message-status live"
                      >
                        <span class="status-dot"></span>
                        Streaming
                      </div>
                    </div>

                    <div
                      class="message-content"
                      :class="{ 'is-streaming': message.role === 'assistant' && streamingAssistantId === message.id }"
                      v-text="message.content || '...'"
                    ></div>

                    <div
                      v-if="message.role === 'assistant'"
                      class="telemetry-wrapper"
                    >
                      <div
                        v-if="getTelemetry(message.id)"
                        class="telemetry-card"
                      >
                        <div class="telemetry-header">
                          <div>
                            <p class="telemetry-title">Response telemetry</p>
                            <p class="telemetry-subtitle">Insights about how this answer was generated</p>
                          </div>
                          <div class="telemetry-badges">
                            <span v-if="getModel(getTelemetry(message.id))" class="telemetry-chip">
                              {{ getModel(getTelemetry(message.id)) }}
                            </span>
                            <span
                              v-if="hasRagSources(getTelemetry(message.id))"
                              class="telemetry-chip success"
                            >
                              Course materials
                            </span>
                            <span
                              v-if="hasWebResults(getTelemetry(message.id))"
                              class="telemetry-chip info"
                            >
                              Web search
                            </span>
                          </div>
                        </div>

                        <div
                          v-if="getRagSources(getTelemetry(message.id)).length"
                          class="telemetry-section"
                        >
                          <p class="section-label">Referenced course materials</p>
                          <ul class="rag-sources">
                            <li
                              v-for="(source, idx) in getRagSources(getTelemetry(message.id))"
                              :key="source.metadata?.material_id || source.metadata?.filename || idx"
                            >
                              <div class="rag-source-title">
                                {{ source.metadata?.filename || source.metadata?.material_id || `Source ${idx + 1}` }}
                                <span v-if="typeof source.score === 'number'" class="rag-score">{{ source.score.toFixed(2) }}</span>
                              </div>
                              <p class="rag-source-snippet">{{ source.snippet || source.text || 'Snippet unavailable.' }}</p>
                            </li>
                          </ul>
                        </div>

                        <div
                          v-if="getWebResults(getTelemetry(message.id)).length"
                          class="telemetry-section"
                        >
                          <p class="section-label">Web snippets</p>
                          <ul class="web-results">
                            <li
                              v-for="(result, idx) in getWebResults(getTelemetry(message.id))"
                              :key="result.url || idx"
                            >
                              <a
                                v-if="result.url"
                                :href="result.url"
                                target="_blank"
                                rel="noopener"
                                class="web-result-link"
                              >
                                {{ result.title || result.url }}
                              </a>
                              <p class="web-result-snippet">{{ result.snippet || 'Context unavailable.' }}</p>
                            </li>
                          </ul>
                        </div>

                        <!-- Tool call telemetry intentionally hidden per UX request -->
                      </div>

                      <div
                        v-else
                        class="telemetry-placeholder"
                        :class="{ 'is-streaming': streamingAssistantId === message.id }"
                      >
                        <span class="status-dot"></span>
                        {{ streamingAssistantId === message.id ? 'Collecting telemetry...' : 'Telemetry unavailable for this response' }}
                      </div>
                    </div>
                  </div>
                </div>
          </div>
        </div>

  <div class="conversation-materials">
          <div class="materials-header">
            <h3>Conversation Materials</h3>
            <span v-if="currentSessionId">
              Linked to this chat
            </span>
          </div>
          <div v-if="!currentSessionId" class="materials-empty">
            Select a chat to see its learning materials.
          </div>
          <div v-else-if="materialsLoading" class="materials-loading">
            Loading linked PDFs...
          </div>
          <div v-else-if="conversationMaterials.length === 0" class="materials-empty">
            No materials yet for this conversation.
          </div>
          <div v-else class="materials-strip">
            <div
              v-for="material in conversationMaterials"
              :key="material.id"
              class="material-card"
            >
              <div class="material-card-head">
                <p class="material-name" :title="material.originalFilename">
                  {{ material.originalFilename }}
                </p>
                <button class="materials-open" @click="openMaterial(material.id)">
                  View
                </button>
              </div>
              <p class="material-meta-text">
                {{ material.courseName }} · {{ formatFileSize(material.fileSize) }}
              </p>
            </div>
          </div>
        </div>

  <div class="quiz-panel">
          <div class="quiz-header">
            <div>
              <h3>Practice quizzes</h3>
              <p>Use every PDF in this conversation to create new drills.</p>
            </div>
            <div class="quiz-header-actions">
              <button
                class="quiz-refresh subtle"
                type="button"
                :disabled="practiceQuizzesLoading || !currentSessionId"
                @click="refreshPracticeQuizzes"
              >
                Refresh
              </button>
              <button
                class="quiz-refresh"
                type="button"
                :disabled="!currentSessionId"
                @click="openPracticePage()"
              >
                Open dashboard
              </button>
            </div>
          </div>

          <div v-if="!currentSessionId" class="quiz-empty">
            Select a conversation to generate quizzes linked to its materials.
          </div>
          <template v-else>
            <div class="quiz-form">
              <label class="quiz-field">
                <span>Type</span>
                <select v-model="quizForm.questionType">
                  <option value="multiple_choice">Multiple choice</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short answer</option>
                </select>
              </label>
              <label class="quiz-field">
                <span>Difficulty</span>
                <select v-model="quizForm.difficulty">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
              <label class="quiz-field">
                <span>Questions</span>
                <input type="number" min="1" max="10" v-model.number="quizForm.count" />
              </label>
              <div class="quiz-generate-wrapper">
                <button
                  class="generate-quiz-button"
                  type="button"
                  :disabled="quizGenerating || conversationMaterials.length === 0"
                  @click="handleGenerateQuiz"
                >
                  {{ quizGenerating ? 'Generating...' : 'Generate quiz' }}
                </button>
                <p class="quiz-helper-text">
                  {{ conversationMaterials.length === 0 ? 'Upload at least one PDF first.' : `Includes ${conversationMaterials.length} linked material${conversationMaterials.length === 1 ? '' : 's'}.` }}
                </p>
              </div>
            </div>

            <div v-if="quizGenerating" class="quiz-progress">
              <div class="quiz-progress-bar">
                <span :style="{ width: `${quizProgress}%` }"></span>
              </div>
              <p class="quiz-progress-label">Building quiz {{ quizProgress }}%</p>
            </div>

            <div v-if="practiceQuizzesLoading" class="quiz-empty">
              Loading generated quizzes...
            </div>
            <div v-else-if="practiceQuizzes.length" class="quiz-history">
              <div
                v-for="quiz in practiceQuizzes"
                :key="quiz.id"
                class="quiz-history-card"
              >
                <div>
                  <p class="quiz-label">Saved quiz</p>
                  <p class="quiz-question">{{ quiz.count }} questions · {{ formatQuestionType(quiz.questionType) }}</p>
                  <p class="quiz-meta">Updated {{ formatDateTime(quiz.updatedAt) }}</p>
                </div>
                <div class="quiz-history-actions">
                  <span class="difficulty-pill" :class="quiz.difficulty">{{ quiz.status }}</span>
                  <button class="quiz-open" type="button" @click="openPracticePage(quiz.id)">
                    Open
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div class="input-area">
          <div class="input-container">
            <button @click="showFileUpload = true" class="attach-button" title="Upload PDF">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>

            <textarea
              v-model="inputMessage"
              @keydown.enter.prevent="sendMessage"
              placeholder="Ask a question or type 'quiz mode' to generate practice questions..."
              rows="1"
              class="message-input"
            ></textarea>

            <button
              @click="sendMessage"
              :disabled="!inputMessage.trim()"
              class="send-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <FileUploadModal
      v-if="showFileUpload"
      @close="showFileUpload = false"
      @upload="handleFileUpload"
    />
  </div>
</template>

<script setup lang="ts">
import type { Conversation, Message as DBMessage } from '~/composables/useConversations'
import type { PracticeQuiz, PracticeQuizQuestion } from '~/composables/usePracticeQuiz'

definePageMeta({
  middleware: 'auth'
})

interface ConversationMaterial {
  id: string
  conversationId: string | null
  courseName: string
  materialType: string
  description: string
  fileSize: number
  originalFilename: string
  createdAt: string
}

interface AgentTelemetry {
  metadata?: Record<string, any>
  toolCalls?: Array<Record<string, any>>
}

interface QuizEvaluationResult {
  is_correct: boolean
  score: number
  feedback: string
}

interface UploadCallbacks {
  onSuccess?: () => void
  onError?: (message?: string) => void
}

const { user, token, signOut } = useAuth()
const router = useRouter()
const conversationsAPI = useConversations()
const practiceQuizAPI = usePracticeQuiz()

const chatSessions = ref<Conversation[]>([])
const currentSessionId = ref<string | null>(null)
const messages = ref<DBMessage[]>([])
const messagesContainer = ref<HTMLElement | null>(null)
const inputMessage = ref('')
const showFileUpload = ref(false)
const showUserMenu = ref(false)
const showMobileSidebar = ref(false)
const loading = ref(false)
const conversationMaterials = ref<ConversationMaterial[]>([])
const materialsLoading = ref(false)
const telemetryByMessage = reactive<Record<string, AgentTelemetry>>({})
const streamingAssistantId = ref<string | null>(null)
const practiceQuizzes = ref<PracticeQuiz[]>([])
const practiceQuizzesLoading = ref(false)
const quizGenerating = ref(false)
const quizProgress = ref(0)
const quizForm = reactive({
  questionType: 'multiple_choice' as PracticeQuizQuestion['questionType'],
  difficulty: 'medium' as PracticeQuizQuestion['difficulty'],
  count: 5,
})

let quizProgressTimer: ReturnType<typeof setInterval> | null = null

const scrollMessagesToBottom = () => {
  nextTick(() => {
    const container = messagesContainer.value
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

const formatTimestamp = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTelemetry = (messageId: string) => telemetryByMessage[messageId] || null

const getModel = (telemetry: AgentTelemetry | null) => telemetry?.metadata?.model || null

const getRagSources = (telemetry: AgentTelemetry | null) => {
  const sources = telemetry?.metadata?.rag_sources
  if (!Array.isArray(sources)) return []
  return sources.slice(0, 3)
}

const hasRagSources = (telemetry: AgentTelemetry | null) => getRagSources(telemetry).length > 0

const getWebResults = (telemetry: AgentTelemetry | null) => {
  const results = telemetry?.metadata?.web_results
  if (!Array.isArray(results)) return []
  return results.slice(0, 3)
}

const hasWebResults = (telemetry: AgentTelemetry | null) => getWebResults(telemetry).length > 0

const getToolCalls = (telemetry: AgentTelemetry | null) => telemetry?.toolCalls || []

const formatToolDetail = (detail: any) => {
  try {
    return JSON.stringify(detail, null, 2)
  } catch (error) {
    return String(detail)
  }
}

const userName = computed(() => {
  return user.value?.name || user.value?.email?.split('@')[0] || 'User'
})

const userInitials = computed(() => {
  const name = userName.value
  return name.substring(0, 2).toUpperCase()
})

onMounted(async () => {
  await loadSessions()
})

watch(messages, () => {
  scrollMessagesToBottom()
}, { deep: true })

watch(streamingAssistantId, () => {
  scrollMessagesToBottom()
})

const loadSessions = async () => {
  try {
    loading.value = true
    chatSessions.value = await conversationsAPI.fetchConversations()
    if (chatSessions.value.length > 0) {
      await selectSession(chatSessions.value[0].id)
    }
  } catch (error) {
    console.error('Failed to load conversations:', error)
  } finally {
    loading.value = false
  }
}

const createNewChat = async () => {
  try {
    loading.value = true
    console.log('[Chat] Creating new conversation...')
    const newConversation = await conversationsAPI.createConversation('New Chat')
    console.log('[Chat] New conversation created:', newConversation)
    chatSessions.value.unshift(newConversation)
    await selectSession(newConversation.id)
  } catch (error: any) {
    console.error('[Chat] Failed to create conversation:', error)
    console.error('[Chat] Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      data: error.data,
      cause: error.cause
    })
    alert(`Failed to create new chat: ${error.message || error.data?.message || 'Unknown error'}`)
  } finally {
    loading.value = false
  }
}

const selectSession = async (sessionId: string) => {
  try {
    loading.value = true
    showMobileSidebar.value = false // Close mobile sidebar after selection
    currentSessionId.value = sessionId
    const [fetchedMessages] = await Promise.all([
  conversationsAPI.fetchMessages(sessionId),
  fetchConversationMaterials(sessionId),
  loadPracticeQuizzes(sessionId)
    ])
    messages.value = fetchedMessages
  } catch (error) {
    console.error('Failed to load messages:', error)
    messages.value = []
  } finally {
    loading.value = false
  }
}

const deleteSession = async (sessionId: string) => {
  try {
    await conversationsAPI.deleteConversation(sessionId)
    chatSessions.value = chatSessions.value.filter(s => s.id !== sessionId)

    if (currentSessionId.value === sessionId) {
      if (chatSessions.value.length > 0) {
        await selectSession(chatSessions.value[0].id)
      } else {
        currentSessionId.value = null
        messages.value = []
        conversationMaterials.value = []
      }
    }
  } catch (error) {
    console.error('Failed to delete conversation:', error)
    alert('Failed to delete chat')
  }
}

const renameSession = async (sessionId: string) => {
  const session = chatSessions.value.find(s => s.id === sessionId)
  if (!session) return

  const currentTitle = session.title || 'New Chat'
  const promptTitle = typeof window !== 'undefined'
    ? window.prompt('Rename conversation', currentTitle)
    : null

  if (promptTitle === null) {
    return
  }

  const trimmedTitle = promptTitle.trim()

  if (!trimmedTitle) {
    alert('Conversation name cannot be empty')
    return
  }

  if (trimmedTitle === session.title) {
    return
  }

  try {
    await conversationsAPI.updateConversation(sessionId, trimmedTitle)
    session.title = trimmedTitle
  } catch (error: any) {
    console.error('[Chat] Failed to rename conversation:', error)
    alert('Failed to rename chat: ' + (error.data?.message || error.message || 'Unknown error'))
  }
}

const sendMessage = async () => {
  const trimmed = inputMessage.value.trim()
  if (!trimmed || loading.value) return

  try {
    if (!currentSessionId.value) {
      await createNewChat()
      if (!currentSessionId.value) return
    }

    const conversationId = currentSessionId.value
    const tempUserId = `temp-user-${Date.now()}`
    const tempMessage: DBMessage = {
      id: tempUserId,
      conversationId,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString()
    }

    inputMessage.value = ''
    loading.value = true
    messages.value.push(tempMessage)

    await streamAgentResponse({
      conversationId,
      prompt: trimmed,
      tempUserId,
    })

    const session = chatSessions.value.find(s => s.id === conversationId)
    if (session && session.title === 'New Chat') {
      const newTitle = trimmed.substring(0, 50)
      await conversationsAPI.updateConversation(conversationId, newTitle)
      session.title = newTitle
    }
  } catch (error: any) {
    console.error('[Chat] Failed to stream message:', error)
    alert(error?.message || 'Agent failed to respond. Please try again in a moment.')
    if (currentSessionId.value) {
      await selectSession(currentSessionId.value)
    }
  } finally {
    streamingAssistantId.value = null
    loading.value = false
  }
}

const handleFileUpload = async (uploadData: any, callbacks?: UploadCallbacks) => {
  if (!user.value) {
    alert('You must be logged in to upload files')
    return
  }

  try {
    loading.value = true

    if (!currentSessionId.value) {
      await createNewChat()
      if (!currentSessionId.value) return
    }

    if (!token.value) {
      throw new Error('No authentication token available')
    }

    const formData = new FormData()
    formData.append('file', uploadData.file)
    formData.append('userId', user.value.id)
    formData.append('conversationId', currentSessionId.value)
    formData.append('courseName', uploadData.courseName)
    formData.append('materialType', uploadData.materialType)
    formData.append('description', uploadData.description)

    console.log('[Chat] Uploading file:', uploadData.file.name)

    const response = await $fetch('/api/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      body: formData
    })

    console.log('[Chat] Upload successful:', response)
    callbacks?.onSuccess?.()
    showFileUpload.value = false

    const aiMessage = await conversationsAPI.sendMessage(
      currentSessionId.value,
      'assistant',
      `Successfully uploaded ${uploadData.file.name}! You can now ask questions about this material.`
    )
    messages.value.push(aiMessage)

    await fetchConversationMaterials(currentSessionId.value)
  } catch (error: any) {
    console.error('[Chat] Upload failed:', error)
    callbacks?.onError?.(error?.data?.message || error?.message || 'Failed to upload file')
    alert('Failed to upload file: ' + (error.data?.message || error.message || 'Unknown error'))
  } finally {
    loading.value = false
  }
}

const fetchConversationMaterials = async (conversationId?: string | null) => {
  if (!token.value || !conversationId) {
    conversationMaterials.value = []
    return
  }

  try {
    materialsLoading.value = true
    const response = await $fetch('/api/materials', {
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      query: {
        conversationId
      }
    })

    conversationMaterials.value = (response.data || []).map((item: any) => ({
      id: item.id,
      conversationId: item.conversationId || null,
      courseName: item.courseName,
      materialType: item.materialType,
      description: item.description,
      fileSize: item.fileSize,
      originalFilename: item.originalFilename,
      createdAt: item.createdAt
    }))
  } catch (error) {
    console.error('[Chat] Failed to fetch materials for conversation:', error)
    conversationMaterials.value = []
  } finally {
    materialsLoading.value = false
  }
}

const clearQuizProgressTimer = () => {
  if (quizProgressTimer) {
    clearInterval(quizProgressTimer)
    quizProgressTimer = null
  }
}

const startQuizProgress = () => {
  clearQuizProgressTimer()
  quizProgress.value = 5
  quizProgressTimer = setInterval(() => {
    quizProgress.value = Math.min(quizProgress.value + Math.random() * 12 + 3, 90)
  }, 400)
}

const stopQuizProgress = (complete = false) => {
  clearQuizProgressTimer()
  if (complete) {
    quizProgress.value = 100
    setTimeout(() => {
      quizGenerating.value = false
      quizProgress.value = 0
    }, 600)
  } else {
    quizGenerating.value = false
    quizProgress.value = 0
  }
}

onBeforeUnmount(() => {
  clearQuizProgressTimer()
})

const loadPracticeQuizzes = async (conversationId?: string | null) => {
  if (!conversationId || !token.value) {
    if (!conversationId) {
      practiceQuizzes.value = []
    }
    return
  }

  try {
    practiceQuizzesLoading.value = true
    const data = await practiceQuizAPI.fetchQuizzes({ conversationId })
    practiceQuizzes.value = data
  } catch (error) {
    console.error('[PracticeQuiz] Failed to load quizzes:', error)
  } finally {
    practiceQuizzesLoading.value = false
  }
}

watch(currentSessionId, (id) => {
  if (!id) {
    practiceQuizzes.value = []
  }
})

const refreshPracticeQuizzes = async () => {
  if (!currentSessionId.value) return
  await loadPracticeQuizzes(currentSessionId.value)
}

const handleGenerateQuiz = async () => {
  if (!currentSessionId.value) {
    alert('Select a conversation first')
    return
  }

  if (conversationMaterials.value.length === 0) {
    alert('Upload at least one material before generating a quiz')
    return
  }

  try {
    quizGenerating.value = true
    startQuizProgress()
    const created = await practiceQuizAPI.createQuiz({
      conversationId: currentSessionId.value,
      questionType: quizForm.questionType,
      difficulty: quizForm.difficulty,
      count: quizForm.count,
    })
    practiceQuizzes.value = [created, ...practiceQuizzes.value]
    stopQuizProgress(true)
    openPracticePage(created.id)
  } catch (error: any) {
    console.error('[PracticeQuiz] Generation failed:', error)
    stopQuizProgress(false)
    alert(error?.data?.message || error?.message || 'Failed to generate quiz')
  }
}

const openPracticePage = (quizId?: string) => {
  const query: Record<string, string> = {}
  if (quizId) {
    query.quizId = quizId
  }
  if (currentSessionId.value) {
    query.conversationId = currentSessionId.value
  }
  router.push({ path: '/quizz', query })
}

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatQuestionType = (value: PracticeQuizQuestion['questionType']) => {
  switch (value) {
    case 'multiple_choice':
      return 'Multiple choice'
    case 'true_false':
      return 'True / False'
    case 'short_answer':
      return 'Short answer'
    default:
      return value
  }
}

interface StreamAgentArgs {
  conversationId: string
  prompt: string
  tempUserId: string
}

const streamAgentResponse = async ({ conversationId, prompt, tempUserId }: StreamAgentArgs) => {
  if (!token.value) {
    throw new Error('No authentication token available')
  }

  const response = await fetch('/api/agent/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token.value}`
    },
    body: JSON.stringify({
      conversationId,
      message: prompt
    })
  })

  if (!response.ok || !response.body) {
    const message = await response.text().catch(() => '')
    throw new Error(message || 'Agent service is unavailable')
  }

  const decoder = new TextDecoder('utf-8')
  const reader = response.body.getReader()
  let buffer = ''
  let assistantTempId: string | null = null

  const replaceMessage = (targetId: string, payload: DBMessage) => {
    const index = messages.value.findIndex(msg => msg.id === targetId)
    if (index !== -1) {
      messages.value.splice(index, 1, payload)
    } else {
      messages.value.push(payload)
    }
  }

  const ensureAssistantPlaceholder = () => {
    if (!assistantTempId) {
      assistantTempId = `assistant-temp-${Date.now()}`
      streamingAssistantId.value = assistantTempId
      messages.value.push({
        id: assistantTempId,
        conversationId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString()
      })
    }
    return assistantTempId
  }

  const appendAssistantContent = (delta: string) => {
    if (!delta) return
    const placeholderId = ensureAssistantPlaceholder()
    const index = messages.value.findIndex(msg => msg.id === placeholderId)
    if (index !== -1) {
      const current = messages.value[index]
      messages.value.splice(index, 1, {
        ...current,
        content: (current.content || '') + delta
      })
    }
  }

  const normalizeMessage = (msg: any): DBMessage => ({
    id: msg.id,
    conversationId: msg.conversationId,
    role: msg.role,
    content: msg.content,
    createdAt: typeof msg.createdAt === 'string'
      ? msg.createdAt
      : new Date(msg.createdAt).toISOString()
  })

  const handleMetadata = (payload: any) => {
    if (!payload?.messageId) return
    telemetryByMessage[payload.messageId] = {
      metadata: payload.metadata || {},
      toolCalls: payload.toolCalls || []
    }
  }

  const processEvent = (eventName: string, data: any) => {
    switch (eventName) {
      case 'user':
        replaceMessage(tempUserId, normalizeMessage(data))
        break
      case 'token':
        appendAssistantContent(data?.delta || '')
        break
      case 'assistant': {
        const normalized = normalizeMessage(data)
        if (assistantTempId) {
          replaceMessage(assistantTempId, normalized)
          assistantTempId = null
        } else {
          messages.value.push(normalized)
        }
        streamingAssistantId.value = normalized.id
        break
      }
      case 'metadata':
        handleMetadata(data)
        break
      case 'error':
        throw new Error(data?.message || 'Agent stream error')
      default:
        break
    }
  }

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }
      buffer += decoder.decode(value, { stream: true })
      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        const parsed = parseClientSse(rawEvent)
        if (parsed) {
          processEvent(parsed.event, parsed.data)
          if (parsed.event === 'done') {
            buffer = ''
            return
          }
        }
        boundary = buffer.indexOf('\n\n')
      }
    }

    if (buffer.trim().length) {
      const parsed = parseClientSse(buffer)
      if (parsed) {
        processEvent(parsed.event, parsed.data)
      }
    }
  } catch (error) {
    removeMessageById(tempUserId)
    removeMessageById(assistantTempId)
    throw error
  }
}

const parseClientSse = (raw: string) => {
  if (!raw?.trim()) {
    return null
  }

  let eventName = 'message'
  const dataLines: string[] = []

  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    }
  }

  const dataString = dataLines.join('\n')
  let parsedData: any = null
  if (dataString) {
    try {
      parsedData = JSON.parse(dataString)
    } catch (err) {
      parsedData = { raw: dataString }
    }
  }

  return {
    event: eventName,
    data: parsedData
  }
}

const removeMessageById = (id: string | null) => {
  if (!id) return
  const index = messages.value.findIndex(msg => msg.id === id)
  if (index !== -1) {
    messages.value.splice(index, 1)
  }
}

const openMaterial = async (materialId: string) => {
  if (!token.value) return

  try {
    const response = await $fetch(`/api/materials/${materialId}`, {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })

    const url = response.data?.publicUrl
    if (url && process.client) {
      window.open(url, '_blank', 'noopener')
    }
  } catch (error) {
    console.error('[Chat] Failed to open material:', error)
    alert('Failed to open material')
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const handleLogout = async () => {
  try {
    await signOut()
    router.push('/')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<style scoped>
.chat-page {
  display: flex;
  height: 100vh;
  background: #f9fafb;
  position: relative;
}

.mobile-sidebar-overlay {
  display: none;
}

@media (max-width: 768px) {
  .mobile-sidebar-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.user-header {
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.mobile-menu-button {
  display: none;
  background: transparent;
  border: none;
  color: #1a1a1a;
  padding: 0.5rem;
  margin-right: auto;
}

@media (max-width: 768px) {
  .mobile-menu-button {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.user-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1a1a;
}

.user-button:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
}

.user-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-menu {
  position: absolute;
  top: 4rem;
  right: 2rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  overflow: hidden;
  z-index: 100;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-menu-item {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.875rem;
  color: #1a1a1a;
}

.user-menu-item:hover {
  background: #f9fafb;
}

.user-menu-item svg {
  color: #6b7280;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem;
  min-height: 0;
  overflow: hidden;
}

.chat-scroll-region {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
  padding-bottom: 1.5rem;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  font-size: 2rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.empty-state p {
  font-size: 1rem;
  color: #6b7280;
}

.messages-container {
  flex: 0 0 auto;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.conversation-materials {
  margin-top: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  flex-shrink: 0;
}

.materials-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.materials-header h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.materials-header span {
  font-size: 0.85rem;
  color: #6b7280;
}

.materials-empty,
.materials-loading {
  padding: 0.75rem 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.materials-strip {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  scroll-snap-type: x proximity;
}

.material-card {
  flex: 0 0 240px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.85rem;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  scroll-snap-align: start;
}

.material-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.material-name {
  flex: 1;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.material-meta-text {
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
}

.materials-open {
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #f8fafc;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1f2937;
  transition: background 0.2s, border-color 0.2s;
}

.materials-open:hover {
  background: #fff;
  border-color: #94a3b8;
}

.quiz-panel {
  margin-top: 1.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex-shrink: 0;
}

.quiz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.quiz-header-actions {
  display: flex;
  gap: 0.75rem;
}

.quiz-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.quiz-header p {
  margin: 0.15rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.quiz-refresh {
  border: 1px solid #d1d5db;
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  background: #f8fafc;
  font-weight: 600;
  font-size: 0.85rem;
  transition: background 0.2s, border-color 0.2s;
}

.quiz-refresh.subtle {
  background: white;
}

.quiz-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quiz-refresh:not(:disabled):hover {
  background: white;
  border-color: #94a3b8;
}

.quiz-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  align-items: flex-end;
}

.quiz-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.quiz-field select,
.quiz-field input {
  border: 1px solid #d1d5db;
  border-radius: 0.6rem;
  padding: 0.5rem 0.65rem;
  font-size: 0.95rem;
}

.quiz-generate-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  align-items: flex-start;
}

.generate-quiz-button {
  border: none;
  border-radius: 0.75rem;
  padding: 0.55rem 1rem;
  background: #111827;
  color: white;
  font-weight: 600;
  transition: background 0.2s;
}

.generate-quiz-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.generate-quiz-button:not(:disabled):hover {
  background: #1f2937;
}

.quiz-helper-text {
  margin: 0;
  font-size: 0.8rem;
  color: #94a3b8;
}

.quiz-empty {
  padding: 1rem;
  background: #f8fafc;
  border: 1px dashed #cbd5f5;
  border-radius: 0.85rem;
  color: #64748b;
  font-size: 0.9rem;
}

.quiz-progress {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.quiz-progress-bar {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.quiz-progress-bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #10b981, #2563eb);
  transition: width 0.3s ease;
}

.quiz-progress-label {
  margin: 0;
  font-size: 0.85rem;
  color: #475569;
}

.quiz-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quiz-history {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quiz-history-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.85rem;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: white;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.quiz-meta {
  margin: 0.35rem 0 0;
  color: #94a3b8;
  font-size: 0.8rem;
}

.quiz-history-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quiz-open {
  border: none;
  border-radius: 0.65rem;
  padding: 0.4rem 0.8rem;
  font-weight: 600;
  background: #2563eb;
  color: white;
}

.quiz-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.9rem;
  padding: 1rem;
  background: #fdfdfd;
  box-shadow: 0 5px 15px rgba(15, 23, 42, 0.05);
}

.quiz-card-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.quiz-label {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}

.quiz-question {
  margin: 0.25rem 0 0;
  font-weight: 600;
  color: #0f172a;
}

.quiz-card-meta {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.difficulty-pill {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  background: #e2e8f0;
  color: #475569;
}

.difficulty-pill.easy {
  background: #ecfdf5;
  color: #047857;
}

.difficulty-pill.medium {
  background: #fef3c7;
  color: #92400e;
}

.difficulty-pill.hard {
  background: #fee2e2;
  color: #b91c1c;
}

.icon-button {
  border: none;
  background: transparent;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  color: #9ca3af;
}

.icon-button:hover {
  color: #ef4444;
}

.quiz-options {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quiz-option label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.65rem;
  background: white;
}

.quiz-options-row {
  display: flex;
  gap: 1rem;
  margin: 0.75rem 0;
}

.quiz-options-row label {
  border: 1px solid #e2e8f0;
  border-radius: 0.65rem;
  padding: 0.45rem 0.9rem;
  background: white;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.quiz-short-answer textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.8rem;
  padding: 0.6rem 0.75rem;
  font-size: 0.95rem;
  resize: vertical;
}

.quiz-actions {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.evaluate-button {
  border: none;
  border-radius: 0.75rem;
  padding: 0.45rem 0.95rem;
  background: #2563eb;
  color: white;
  font-weight: 600;
}

.evaluate-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quiz-stats {
  font-size: 0.85rem;
  color: #64748b;
}

.quiz-feedback {
  margin-top: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: 0.8rem;
  border: 1px solid transparent;
}

.quiz-feedback.success {
  background: #ecfdf5;
  border-color: #6ee7b7;
  color: #065f46;
}

.quiz-feedback.error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.feedback-title {
  margin: 0;
  font-weight: 700;
}

.feedback-text {
  margin: 0.25rem 0 0.35rem;
  font-size: 0.9rem;
}

.feedback-reference {
  margin: 0;
  font-size: 0.8rem;
  color: inherit;
  opacity: 0.8;
}

.message-entry {
  display: flex;
  gap: 1rem;
  animation: slideIn 0.3s ease;
}

.message-entry.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.95rem;
  color: white;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  flex-shrink: 0;
}

.message-entry.assistant .message-avatar {
  background: transparent;
  border: 1px solid #e5e7eb;
}

.assistant-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #eef2ff;
  color: #4338ca;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.message-author {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #4b5563;
}

.message-role {
  font-weight: 600;
  color: #111827;
}

.message-timestamp {
  font-size: 0.8rem;
  color: #9ca3af;
}

.message-status {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #4b5563;
}

.message-status .status-dot,
.telemetry-placeholder .status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #22c55e;
  display: inline-flex;
}

.message-status.live .status-dot {
  animation: pulse 1.5s infinite;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(0.7);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.message-content {
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
  border: 1px solid transparent;
}

.message-entry.user .message-content {
  background: #111827;
  color: white;
}

.message-entry.assistant .message-content {
  background: white;
  color: #111827;
  border-color: #e5e7eb;
}

.message-content.is-streaming {
  border-style: dashed;
}

.telemetry-wrapper {
  margin-top: 0.35rem;
}

.telemetry-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.85rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.telemetry-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.telemetry-title {
  margin: 0;
  font-weight: 600;
  color: #0f172a;
}

.telemetry-subtitle {
  margin: 0.15rem 0 0;
  color: #64748b;
  font-size: 0.85rem;
}

.telemetry-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.telemetry-chip {
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid #cbd5f5;
  color: #4338ca;
  background: #eef2ff;
}

.telemetry-chip.success {
  color: #065f46;
  border-color: #a7f3d0;
  background: #ecfdf5;
}

.telemetry-chip.info {
  color: #075985;
  border-color: #bae6fd;
  background: #e0f2fe;
}

.telemetry-section {
  border-top: 1px solid #e2e8f0;
  padding-top: 0.75rem;
}

.section-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 0.5rem;
}

.rag-sources,
.web-results,
.tool-call-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rag-source-title {
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.rag-score {
  font-size: 0.75rem;
  color: #6b7280;
  background: #f1f5f9;
  border-radius: 0.5rem;
  padding: 0.1rem 0.35rem;
}

.rag-source-snippet,
.web-result-snippet {
  margin: 0.35rem 0 0;
  color: #475569;
  font-size: 0.9rem;
}

.web-result-link {
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
}

.web-result-link:hover {
  text-decoration: underline;
}

.tool-call-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tool-name {
  font-weight: 600;
  color: #0f172a;
}

.tool-status {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;
  background: #e2e8f0;
  color: #475569;
}

.tool-status.success {
  background: #ecfdf5;
  color: #047857;
}

.tool-status.error {
  background: #fef2f2;
  color: #b91c1c;
}

.tool-detail {
  margin-top: 0.35rem;
  background: #0f172a;
  color: #e2e8f0;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  white-space: pre-wrap;
  max-height: 200px;
  overflow: auto;
}

.telemetry-placeholder {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #94a3b8;
  font-size: 0.85rem;
}

.telemetry-placeholder.is-streaming {
  color: #4338ca;
}

.input-area {
  padding: 1.5rem 0 0;
  position: sticky;
  bottom: 0;
  background: #f9fafb;
  flex-shrink: 0;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 1.5rem;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.attach-button {
  background: transparent;
  border: none;
  color: #6b7280;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.attach-button:hover {
  color: #1a1a1a;
}

.message-input {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 1rem;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.message-input::placeholder {
  color: #9ca3af;
}

.send-button {
  background: #1a1a1a;
  border: none;
  color: white;
  padding: 0.625rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.send-button:hover:not(:disabled) {
  background: #2d2d2d;
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .chat-page {
    flex-direction: column;
    height: 100vh;
    height: 100dvh; /* Dynamic viewport height for mobile browsers */
  }

  .main-content {
    width: 100%;
  }

  .user-header {
    padding: 0.75rem 1rem;
  }

  .user-button {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }

  .user-avatar {
    width: 28px;
    height: 28px;
    font-size: 0.6875rem;
  }

  .user-name {
    max-width: 100px;
  }

  .user-menu {
    right: 1rem;
    min-width: 180px;
  }

  .chat-container {
    padding: 1rem;
  }

  .empty-state {
    padding: 2rem 1rem;
  }

  .empty-icon {
    font-size: 3rem;
  }

  .empty-state h2 {
    font-size: 1.5rem;
  }

  .empty-state p {
    font-size: 0.9rem;
  }

  .message-entry {
    gap: 0.75rem;
  }

  .message-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
  }

  .message-content {
    padding: 0.875rem 1rem;
    font-size: 0.9375rem;
  }

  .conversation-materials {
    padding: 0.875rem 1rem;
  }

  .materials-header h3 {
    font-size: 0.95rem;
  }

  .materials-header span {
    font-size: 0.8rem;
  }

  .materials-strip {
    flex-direction: column;
    gap: 0.75rem;
  }

  .material-card {
    flex: 1 1 auto;
    width: 100%;
  }

  .quiz-panel {
    padding: 1rem;
  }

  .quiz-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .quiz-header h3 {
    font-size: 1rem;
  }

  .quiz-header p {
    font-size: 0.85rem;
  }

  .quiz-header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .quiz-form {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .quiz-field {
    font-size: 0.8rem;
  }

  .quiz-field select,
  .quiz-field input {
    font-size: 0.9rem;
    padding: 0.5rem;
  }

  .generate-quiz-button {
    width: 100%;
    padding: 0.65rem 1rem;
  }

  .quiz-history-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .quiz-history-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .telemetry-card {
    padding: 0.875rem;
  }

  .telemetry-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .telemetry-title {
    font-size: 0.9rem;
  }

  .telemetry-subtitle {
    font-size: 0.8rem;
  }

  .input-area {
    padding: 1rem 0 0;
  }

  .input-container {
    padding: 0.5rem 0.75rem;
  }

  .message-input {
    font-size: 0.9375rem;
  }
}

@media (max-width: 480px) {
  .user-name {
    display: none;
  }

  .user-button {
    padding: 0.375rem;
  }

  .user-menu {
    right: 0.5rem;
    left: auto;
    min-width: 160px;
  }

  .chat-container {
    padding: 0.75rem;
  }

  .quiz-header-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .quiz-refresh {
    width: 100%;
  }
}
</style>
