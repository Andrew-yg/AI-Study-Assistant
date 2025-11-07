<template>
  <div class="chat-page">
    <Sidebar
      :sessions="chatSessions"
      :current-session-id="currentSessionId"
      @new-chat="createNewChat"
      @select-session="selectSession"
      @delete-session="deleteSession"
    />

    <div class="main-content">
      <div class="chat-container">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">⚡️</div>
          <h2>How can I help you today?</h2>
          <p>Upload your lecture notes and start asking questions or generate practice quizzes</p>
        </div>

        <div v-else class="messages-container">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message', message.role]"
          >
            <div class="message-content">{{ message.content }}</div>
          </div>
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
definePageMeta({
  middleware: 'auth'
})

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

const { user } = useAuth()
const chatSessions = ref<ChatSession[]>([])
const currentSessionId = ref<string | null>(null)
const messages = ref<Message[]>([])
const inputMessage = ref('')
const showFileUpload = ref(false)

onMounted(() => {
  loadSessions()
})

const loadSessions = () => {
  const stored = localStorage.getItem('chat-sessions')
  if (stored) {
    chatSessions.value = JSON.parse(stored)
    if (chatSessions.value.length > 0) {
      selectSession(chatSessions.value[0].id)
    }
  }
}

const saveSessions = () => {
  localStorage.setItem('chat-sessions', JSON.stringify(chatSessions.value))
}

const createNewChat = () => {
  const newSession: ChatSession = {
    id: Date.now().toString(),
    title: 'New Chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  chatSessions.value.unshift(newSession)
  saveSessions()
  selectSession(newSession.id)
}

const selectSession = (sessionId: string) => {
  currentSessionId.value = sessionId
  const session = chatSessions.value.find(s => s.id === sessionId)
  messages.value = session?.messages || []
}

const deleteSession = (sessionId: string) => {
  chatSessions.value = chatSessions.value.filter(s => s.id !== sessionId)
  saveSessions()

  if (currentSessionId.value === sessionId) {
    if (chatSessions.value.length > 0) {
      selectSession(chatSessions.value[0].id)
    } else {
      currentSessionId.value = null
      messages.value = []
    }
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return

  if (!currentSessionId.value) {
    createNewChat()
  }

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: inputMessage.value,
    timestamp: Date.now()
  }

  messages.value.push(userMessage)

  const session = chatSessions.value.find(s => s.id === currentSessionId.value)
  if (session) {
    session.messages.push(userMessage)

    if (session.title === 'New Chat') {
      session.title = inputMessage.value.substring(0, 50)
    }
    session.updatedAt = Date.now()
  }

  inputMessage.value = ''

  await new Promise(resolve => setTimeout(resolve, 500))

  const aiMessage: Message = {
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content: 'This is a demo response. Connect your AI service to get real responses based on your uploaded materials.',
    timestamp: Date.now()
  }

  messages.value.push(aiMessage)
  if (session) {
    session.messages.push(aiMessage)
    session.updatedAt = Date.now()
  }

  saveSessions()
}

const handleFileUpload = async (uploadData: any) => {
  if (!user.value) {
    alert('You must be logged in to upload files')
    return
  }

  try {
    const formData = new FormData()
    formData.append('file', uploadData.file)
    formData.append('userId', user.value.id)
    formData.append('courseName', uploadData.courseName)
    formData.append('materialType', uploadData.materialType)
    formData.append('description', uploadData.description)

    const response = await $fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    console.log('Upload successful:', response)
    showFileUpload.value = false

    const aiMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Successfully uploaded ${uploadData.file.name}! You can now ask questions about this material.`,
      timestamp: Date.now()
    }
    messages.value.push(aiMessage)

    const session = chatSessions.value.find(s => s.id === currentSessionId.value)
    if (session) {
      session.messages.push(aiMessage)
      session.updatedAt = Date.now()
      saveSessions()
    }
  } catch (error: any) {
    console.error('Upload failed:', error)
    alert('Failed to upload file: ' + (error.message || 'Unknown error'))
  }
}
</script>

<style scoped>
.chat-page {
  display: flex;
  height: 100vh;
  background: #f9fafb;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem;
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
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  animation: slideIn 0.3s ease;
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

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  line-height: 1.5;
}

.message.user .message-content {
  background: #1a1a1a;
  color: white;
}

.message.assistant .message-content {
  background: white;
  color: #1a1a1a;
  border: 1px solid #e5e7eb;
}

.input-area {
  padding: 1.5rem 0 0;
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
</style>
