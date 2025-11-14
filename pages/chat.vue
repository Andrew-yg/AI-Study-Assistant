<template>
  <div class="chat-page">
    <Sidebar
      :sessions="chatSessions"
      :current-session-id="currentSessionId"
      @new-chat="createNewChat"
      @select-session="selectSession"
      @delete-session="deleteSession"
      @rename-session="renameSession"
    />

    <div class="main-content">
      <div class="user-header">
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
          <ul v-else class="materials-list">
            <li v-for="material in conversationMaterials" :key="material.id" class="materials-list-item">
              <div class="material-meta-info">
                <p class="material-name">{{ material.originalFilename }}</p>
                <p class="material-meta-text">
                  {{ material.courseName }} · {{ formatFileSize(material.fileSize) }}
                </p>
              </div>
              <button class="materials-open" @click="openMaterial(material.id)">
                View
              </button>
            </li>
          </ul>
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

const { user, token, signOut } = useAuth()
const router = useRouter()
const conversationsAPI = useConversations()

const chatSessions = ref<Conversation[]>([])
const currentSessionId = ref<string | null>(null)
const messages = ref<DBMessage[]>([])
const inputMessage = ref('')
const showFileUpload = ref(false)
const showUserMenu = ref(false)
const loading = ref(false)
const conversationMaterials = ref<ConversationMaterial[]>([])
const materialsLoading = ref(false)

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
    currentSessionId.value = sessionId
    const [fetchedMessages] = await Promise.all([
      conversationsAPI.fetchMessages(sessionId),
      fetchConversationMaterials(sessionId)
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
  if (!inputMessage.value.trim() || loading.value) return

  try {
    if (!currentSessionId.value) {
      await createNewChat()
      if (!currentSessionId.value) return
    }

    const userContent = inputMessage.value
    inputMessage.value = ''
    loading.value = true

    const userMessage = await conversationsAPI.sendMessage(
      currentSessionId.value,
      'user',
      userContent
    )
    messages.value.push(userMessage)

    const session = chatSessions.value.find(s => s.id === currentSessionId.value)
    if (session && session.title === 'New Chat') {
      const newTitle = userContent.substring(0, 50)
      await conversationsAPI.updateConversation(currentSessionId.value, newTitle)
      session.title = newTitle
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    const aiMessage = await conversationsAPI.sendMessage(
      currentSessionId.value,
      'assistant',
      'This is a demo response. Connect your AI service to get real responses based on your uploaded materials.'
    )
    messages.value.push(aiMessage)

  } catch (error) {
    console.error('Failed to send message:', error)
    alert('Failed to send message')
  } finally {
    loading.value = false
  }
}

const handleFileUpload = async (uploadData: any) => {
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
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-header {
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  position: relative;
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

.conversation-materials {
  margin-top: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1rem 1.25rem;
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

.materials-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.materials-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
  border-top: 1px solid #f3f4f6;
}

.materials-list-item:first-child {
  border-top: none;
}

.material-meta-info {
  flex: 1;
  min-width: 0;
}

.material-name {
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.material-meta-text {
  margin: 0.25rem 0 0;
  color: #6b7280;
  font-size: 0.85rem;
}

.materials-open {
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1f2937;
  transition: background 0.2s, border-color 0.2s;
}

.materials-open:hover {
  background: #fff;
  border-color: #9ca3af;
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

@media (max-width: 768px) {
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

  .materials-list-item {
    flex-direction: column;
    align-items: flex-start;
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
}
</style>
