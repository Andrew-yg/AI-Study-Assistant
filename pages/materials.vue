<template>
  <div class="materials-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Learning Materials</h1>
        <p>Manage your uploaded study materials</p>
      </div>
      <button @click="goToChat" class="back-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Chat
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading materials...</p>
    </div>

    <div v-else-if="materials.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <h2>No materials yet</h2>
      <p>Upload your first learning material to get started</p>
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
          <div class="material-type-badge" :class="material.material_type">
            {{ formatMaterialType(material.material_type) }}
          </div>
        </div>

        <div class="card-body">
          <h3 class="material-title">{{ material.original_filename }}</h3>
          <p class="course-name">{{ material.course_name }}</p>
          <p v-if="material.description" class="description">
            {{ material.description }}
          </p>
          <div class="meta-info">
            <span class="file-size">{{ formatFileSize(material.file_size) }}</span>
            <span class="upload-date">{{ formatDate(material.created_at) }}</span>
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

import type { LearningMaterial } from '~/utils/supabase'

const { user } = useAuth()
const materials = ref<LearningMaterial[]>([])
const loading = ref(true)
const showUploadModal = ref(false)
const editingMaterial = ref<LearningMaterial | null>(null)
const router = useRouter()

const goToChat = () => {
  router.push('/chat')
}

onMounted(async () => {
  await fetchMaterials()
})

const fetchMaterials = async () => {
  if (!user.value) return

  try {
    loading.value = true
    const response = await $fetch(`/api/materials?userId=${user.value.id}`)
    materials.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch materials:', error)
  } finally {
    loading.value = false
  }
}

const handleUpload = async (uploadData: any) => {
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

    await $fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    showUploadModal.value = false
    await fetchMaterials()
  } catch (error: any) {
    console.error('Upload failed:', error)
    alert('Failed to upload file: ' + (error.message || 'Unknown error'))
  }
}

const editMaterial = (material: LearningMaterial) => {
  editingMaterial.value = material
}

const handleEdit = async (materialId: string, updates: any) => {
  try {
    await $fetch(`/api/materials/${materialId}`, {
      method: 'PUT',
      body: updates
    })

    editingMaterial.value = null
    await fetchMaterials()
  } catch (error: any) {
    console.error('Edit failed:', error)
    alert('Failed to update material: ' + (error.message || 'Unknown error'))
  }
}

const deleteMaterial = async (materialId: string) => {
  if (!confirm('Are you sure you want to delete this material?')) {
    return
  }

  try {
    await $fetch(`/api/materials/${materialId}`, {
      method: 'DELETE'
    })

    await fetchMaterials()
  } catch (error: any) {
    console.error('Delete failed:', error)
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
  }

  .materials-grid {
    grid-template-columns: 1fr;
  }
}
</style>
