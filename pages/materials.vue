<template>
  <div class="materials-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Learning Materials</h1>
        <p>Manage uploads per conversation for more accurate study sessions</p>
      </div>
      <div class="header-actions">
        <div class="filter-group">
          <label for="conversation-filter">Conversation</label>
          <select
            id="conversation-filter"
            v-model="selectedConversationFilter"
            class="filter-select"
          >
            <option value="all">All conversations</option>
            <option value="unassigned">No conversation</option>
            <option
              v-for="conversation in conversations"
              :key="conversation.id"
              :value="conversation.id"
            >
              {{ conversation.title || 'Untitled conversation' }}
            </option>
          </select>
        </div>
        <button @click="showUploadModal = true" class="primary-button">
          Upload Material
        </button>
        <button @click="goToChat" class="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Chat
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading materials...</p>
    </div>

    <div v-else-if="materials.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <h2>No materials for {{ currentFilterLabel }}</h2>
      <p>Select another conversation or upload a PDF to start building context</p>
      <button @click="showUploadModal = true" class="empty-upload-button">
        Upload Material
      </button>
    </div>

    <div v-else class="materials-grid">
      <div
        v-for="material in materials"
        :key="material.id"
        class="material-card"
      >
        <div class="card-header">
          <div class="file-icon">📄</div>
          <div class="material-type-badge" :class="material.materialType">
            {{ formatMaterialType(material.materialType) }}
          </div>
        </div>

        <div class="conversation-chip">
          {{ getConversationLabel(material.conversationId) }}
        </div>

        <div class="card-body">
          <h3 class="material-title">{{ material.originalFilename }}</h3>
          <p class="course-name">{{ material.courseName }}</p>
          <p v-if="material.description" class="description">
            {{ material.description }}
          </p>
          <div class="meta-info">
            <span class="file-size">{{ formatFileSize(material.fileSize) }}</span>
            <span class="upload-date">{{ formatDate(material.createdAt) }}</span>
          </div>
        </div>

        <div class="card-actions">
          <button @click="editMaterial(material)" class="action-button edit-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
          <button @click="deleteMaterial(material.id)" class="action-button delete-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>

    <FileUploadModal
      v-if="showUploadModal"
      @close="showUploadModal = false"
      @upload="handleUpload"
    />

    <EditMaterialModal
      v-if="editingMaterial"
      :material="editingMaterial"
      @close="editingMaterial = null"
      @save="handleEdit"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

interface LearningMaterial {
  id: string
  userId: string
  conversationId: string | null
  courseName: string
  materialType: string
  description: string
  filePath: string
  fileSize: number
  originalFilename: string
  createdAt: string
  updatedAt: string
}

interface ConversationSummary {
  id: string
  title: string
}

interface UploadCallbacks {
  onSuccess?: () => void
  onError?: (message?: string) => void
}

const { user, token } = useAuth()
const conversationsAPI = useConversations()
const graphqlAPI = useGraphQL() // GraphQL integration
const materials = ref<LearningMaterial[]>([])
const conversations = ref<ConversationSummary[]>([])
const loading = ref(true)
const showUploadModal = ref(false)
const editingMaterial = ref<LearningMaterial | null>(null)
const router = useRouter()
const selectedConversationFilter = ref<'all' | 'unassigned' | string>('all')

const conversationLookup = computed<Record<string, string>>(() => {
  const lookup: Record<string, string> = {}
  for (const convo of conversations.value) {
    lookup[convo.id] = convo.title || 'Untitled conversation'
  }
  return lookup
})

const currentFilterLabel = computed(() => {
  if (selectedConversationFilter.value === 'all') return 'all conversations'
  if (selectedConversationFilter.value === 'unassigned') return 'no conversation'
  return conversationLookup.value[selectedConversationFilter.value] || 'selected conversation'
})

const goToChat = () => {
  router.push('/chat')
}

onMounted(async () => {
  await loadConversations()
  await fetchMaterials()
})

watch(selectedConversationFilter, async () => {
  await fetchMaterials()
})

// GraphQL Call #1: Fetch conversations using GraphQL
const loadConversations = async () => {
  if (!token.value) return
  try {
    console.log('[Materials] Fetching conversations via GraphQL...')
    const { data, error } = graphqlAPI.fetchConversations()
    
    // Watch for data changes
    watch(data, (newData) => {
      if (newData?.conversations) {
        conversations.value = newData.conversations.map(conv => ({
          id: conv.id,
          title: conv.title
        }))
        console.log('[Materials] Loaded', conversations.value.length, 'conversations via GraphQL')
      }
    }, { immediate: true })

    watch(error, (newError) => {
      if (newError) {
        console.error('[Materials] GraphQL error loading conversations:', newError)
        // Fallback to REST if GraphQL fails
        console.log('[Materials] Falling back to REST API...')
        conversationsAPI.fetchConversations().then(data => {
          conversations.value = data
        })
      }
    }, { immediate: true })
  } catch (err) {
    console.error('[Materials] Failed to load conversations:', err)
  }
}

// GraphQL Call #2: Fetch materials using GraphQL
const fetchMaterials = async () => {
  if (!user.value || !token.value) return

  try {
    loading.value = true
    console.log('[Materials] Fetching materials via GraphQL...')

    const conversationId = selectedConversationFilter.value === 'all' || selectedConversationFilter.value === 'unassigned'
      ? ref<string | null>(null)
      : ref<string | null>(selectedConversationFilter.value)

    const { data, error } = graphqlAPI.fetchMaterials(
      selectedConversationFilter.value === 'all' ? undefined : conversationId
    )
    
    // Watch for data changes
    watch(data, (newData) => {
      if (newData?.materials) {
        materials.value = newData.materials.map((item: any) => ({
          id: item.id,
          userId: item.userId,
          conversationId: item.conversationId || null,
          courseName: item.courseName,
          materialType: item.materialType,
          description: item.description,
          filePath: item.filePath,
          fileSize: item.fileSize,
          originalFilename: item.originalFilename,
          processingStatus: item.processingStatus || 'processed',
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }))
        console.log('[Materials] Loaded', materials.value.length, 'materials via GraphQL')
        loading.value = false
      }
    }, { immediate: true })

    watch(error, (newError) => {
      if (newError) {
        console.error('[Materials] GraphQL error loading materials:', newError)
        // Fallback to REST if GraphQL fails
        console.log('[Materials] Falling back to REST API...')
        fallbackToRestMaterials()
      }
    }, { immediate: true })
  } catch (err) {
    console.error('[Materials] Failed to fetch materials:', err)
    loading.value = false
    fallbackToRestMaterials()
  }
}

// Fallback function to use REST API if GraphQL fails
const fallbackToRestMaterials = async () => {
  try {
    const query: Record<string, string> = {}
    if (selectedConversationFilter.value !== 'all') {
      query.conversationId = selectedConversationFilter.value === 'unassigned'
        ? 'null'
        : selectedConversationFilter.value
    }

    const response = await $fetch('/api/materials', {
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      query
    })
    
    materials.value = (response.data || []).map((item: any) => ({
      id: item.id,
      userId: item.userId,
      conversationId: item.conversationId || null,
      courseName: item.courseName,
      materialType: item.materialType,
      description: item.description,
      filePath: item.filePath,
      fileSize: item.fileSize,
      originalFilename: item.originalFilename,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))
    console.log('[Materials] Loaded', materials.value.length, 'materials via REST API')
  } catch (error) {
    console.error('[Materials] REST API also failed:', error)
  } finally {
    loading.value = false
  }
}

const handleUpload = async (uploadData: any, callbacks?: UploadCallbacks) => {
  if (!user.value || !token.value) {
    alert('You must be logged in to upload files')
    return
  }

  try {
    console.log('[Materials] Starting upload...')

    const formData = new FormData()
    formData.append('file', uploadData.file)
    formData.append('userId', user.value.id)
    formData.append('courseName', uploadData.courseName)
    formData.append('materialType', uploadData.materialType)
    formData.append('description', uploadData.description)
    if (selectedConversationFilter.value !== 'all') {
      const convoId = selectedConversationFilter.value === 'unassigned'
        ? ''
        : selectedConversationFilter.value
      formData.append('conversationId', convoId)
    }

    console.log('[Materials] Uploading file:', uploadData.file.name)
    await $fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })

    console.log('[Materials] Upload successful')
    showUploadModal.value = false
    callbacks?.onSuccess?.()
    await fetchMaterials()
  } catch (error: any) {
    console.error('[Materials] Upload failed:', error)
    callbacks?.onError?.(error?.data?.message || error?.message || 'Upload failed')
    alert('Failed to upload file: ' + (error.message || 'Unknown error'))
  }
}

const editMaterial = (material: LearningMaterial) => {
  editingMaterial.value = material
}

const handleEdit = async (materialId: string, updates: any) => {
  if (!token.value) {
    alert('Authentication error. Please try logging in again.')
    return
  }

  try {
    console.log('[Materials] Editing material:', materialId)

    await $fetch(`/api/materials/${materialId}`, {
      method: 'PUT',
      body: updates,
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })

    console.log('[Materials] Edit successful')
    editingMaterial.value = null
    await fetchMaterials()
  } catch (error: any) {
    console.error('[Materials] Edit failed:', error)
    alert('Failed to update material: ' + (error.message || 'Unknown error'))
  }
}

const deleteMaterial = async (materialId: string) => {
  if (!confirm('Are you sure you want to delete this material?')) {
    return
  }

  if (!token.value) {
    alert('Authentication error. Please try logging in again.')
    return
  }

  try {
    console.log('[Materials] Deleting material:', materialId)

    await $fetch(`/api/materials/${materialId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })

    console.log('[Materials] Delete successful')
    await fetchMaterials()
  } catch (error: any) {
    console.error('[Materials] Delete failed:', error)
    alert('Failed to delete material: ' + (error.message || 'Unknown error'))
  }
}

const formatMaterialType = (type: string) => {
  const types: Record<string, string> = {
    lecture: 'Lecture',
    textbook: 'Textbook',
    slides: 'Slides',
    assignment: 'Assignment',
    other: 'Other'
  }
  return types[type] || type
}

const getConversationLabel = (conversationId: string | null) => {
  if (!conversationId) return 'No conversation'
  return conversationLookup.value[conversationId] || 'Conversation'
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.materials-page {
  min-height: 100vh;
  background: #f9fafb;
  padding: 2rem;
}

.page-header {
  max-width: 1200px;
  margin: 0 auto 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-actions {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 220px;
}

.filter-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #4b5563;
}

.filter-select {
  padding: 0.6rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  min-width: 220px;
}

.primary-button {
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  transition: background 0.2s;
}

.primary-button:hover {
  background: #1e40af;
}

.header-content h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.25rem;
}

.header-content p {
  color: #6b7280;
  font-size: 1rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #1a1a1a;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  transition: background 0.2s;
}

.back-button:hover {
  background: #2d2d2d;
}

.loading-state {
  max-width: 1200px;
  margin: 4rem auto;
  text-align: center;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 3px solid #e5e7eb;
  border-top-color: #1a1a1a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  max-width: 1200px;
  margin: 4rem auto;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin-bottom: 1.5rem;
}

.empty-upload-button {
  padding: 0.75rem 1.5rem;
  background: #1a1a1a;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  transition: background 0.2s;
}

.empty-upload-button:hover {
  background: #2d2d2d;
}

.materials-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.material-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  transition: box-shadow 0.2s;
}

.material-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.conversation-chip {
  align-self: flex-start;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.file-icon {
  font-size: 2rem;
}

.material-type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.material-type-badge.lecture {
  background: #dbeafe;
  color: #1e40af;
}

.material-type-badge.textbook {
  background: #dcfce7;
  color: #15803d;
}

.material-type-badge.slides {
  background: #fef3c7;
  color: #92400e;
}

.material-type-badge.assignment {
  background: #fce7f3;
  color: #9f1239;
}

.material-type-badge.other {
  background: #f3f4f6;
  color: #374151;
}

.card-body {
  margin-bottom: 1rem;
}

.material-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
  word-break: break-word;
}

.course-name {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.description {
  color: #9ca3af;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.meta-info {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
}

.edit-button {
  background: white;
  color: #1a1a1a;
}

.edit-button:hover {
  background: #f9fafb;
  border-color: #1a1a1a;
}

.delete-button {
  background: white;
  color: #dc2626;
}

.delete-button:hover {
  background: #fef2f2;
  border-color: #dc2626;
}

@media (max-width: 768px) {
  .materials-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-content h1 {
    font-size: 1.5rem;
  }

  .header-content p {
    font-size: 0.9rem;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    width: 100%;
    min-width: auto;
  }

  .filter-select {
    width: 100%;
    min-width: auto;
  }

  .primary-button,
  .back-button {
    width: 100%;
    justify-content: center;
  }

  .materials-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .material-card {
    padding: 1.25rem;
  }

  .card-actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .materials-page {
    padding: 0.75rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .header-content h1 {
    font-size: 1.25rem;
  }

  .material-title {
    font-size: 1rem;
  }
}
</style>
