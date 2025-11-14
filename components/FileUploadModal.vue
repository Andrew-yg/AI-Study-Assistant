<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Upload Learning Material</h3>
        <button @click="$emit('close')" class="close-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleUpload" class="upload-form">
        <div class="form-section">
          <label class="form-label" for="course-name">Course Name *</label>
          <input
            id="course-name"
            v-model="formData.courseName"
            type="text"
            placeholder="e.g., CS 229 - Machine Learning"
            class="form-input"
            required
          />
        </div>

        <div class="form-section">
          <label class="form-label" for="material-type">Material Type *</label>
          <select
            id="material-type"
            v-model="formData.materialType"
            class="form-select"
            required
          >
            <option value="" disabled>Select type</option>
            <option value="lecture">Lecture Notes</option>
            <option value="textbook">Textbook Chapter</option>
            <option value="slides">Presentation Slides</option>
            <option value="assignment">Assignment</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div class="form-section">
          <label class="form-label" for="description">Description</label>
          <textarea
            id="description"
            v-model="formData.description"
            placeholder="Add notes about this material (optional)"
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>

        <div class="form-section">
          <label class="form-label">PDF File *</label>
          <div class="upload-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
            <input
              ref="fileInput"
              type="file"
              accept=".pdf"
              @change="handleFileSelect"
              style="display: none"
            />

            <div v-if="!selectedFile" class="upload-placeholder">
              <div class="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              </div>
              <p class="upload-text">Click to upload or drag and drop</p>
              <p class="upload-hint">PDF files only</p>
            </div>

            <div v-else class="file-selected">
              <div class="file-icon">📄</div>
              <div class="file-info">
                <div class="file-name">{{ selectedFile.name }}</div>
                <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
              </div>
              <button @click.stop="selectedFile = null" class="remove-file-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="cancel-button">Cancel</button>
          <button type="submit" :disabled="!isFormValid || uploading" class="upload-button">
            {{ uploading ? 'Uploading...' : 'Upload Material' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
interface UploadPayload {
  file: File
  courseName: string
  materialType: string
  description: string
}

interface UploadCallbacks {
  onSuccess?: () => void
  onError?: (message?: string) => void
}

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'upload', payload: UploadPayload, callbacks?: UploadCallbacks): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const error = ref('')

const formData = ref({
  courseName: '',
  materialType: '',
  description: ''
})

const resetForm = () => {
  formData.value = {
    courseName: '',
    materialType: '',
    description: ''
  }
  selectedFile.value = null
  error.value = ''
}

const isFormValid = computed(() => {
  return formData.value.courseName.trim() &&
         formData.value.materialType &&
         selectedFile.value !== null
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    validateAndSetFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0]
  if (file) {
    validateAndSetFile(file)
  }
}

const validateAndSetFile = (file: File) => {
  error.value = ''

  if (file.type !== 'application/pdf') {
    error.value = 'Please upload a PDF file'
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    error.value = 'File size must be less than 10MB'
    return
  }

  selectedFile.value = file
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const handleUpload = async () => {
  if (!isFormValid.value || !selectedFile.value) return

  uploading.value = true
  error.value = ''

  const uploadData: UploadPayload = {
    file: selectedFile.value,
    courseName: formData.value.courseName.trim(),
    materialType: formData.value.materialType,
    description: formData.value.description.trim()
  }

  const callbacks: UploadCallbacks = {
    onSuccess: () => {
      resetForm()
      uploading.value = false
      emit('close')
    },
    onError: (message?: string) => {
      error.value = message || 'Upload failed'
      uploading.value = false
    }
  }

  try {
    emit('upload', uploadData, callbacks)
  } catch (err: any) {
    callbacks.onError?.(err?.message || 'Upload failed')
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 600px;
  padding: 1.5rem;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
}

.close-button {
  background: transparent;
  border: none;
  color: #6b7280;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-button:hover {
  color: #1a1a1a;
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  color: #1a1a1a;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #9ca3af;
}

.form-select {
  cursor: pointer;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #f9fafb;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.upload-icon {
  color: #6b7280;
}

.upload-text {
  font-weight: 600;
  color: #1a1a1a;
}

.upload-hint {
  font-size: 0.875rem;
  color: #6b7280;
}

.file-selected {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.file-icon {
  font-size: 2rem;
}

.file-info {
  flex: 1;
  text-align: left;
}

.file-name {
  font-weight: 600;
  color: #1a1a1a;
  word-break: break-word;
}

.file-size {
  font-size: 0.875rem;
  color: #6b7280;
}

.remove-file-button {
  background: transparent;
  border: none;
  color: #6b7280;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.remove-file-button:hover {
  color: #ef4444;
}

.error-message {
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.875rem;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.cancel-button,
.upload-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.2s;
}

.cancel-button {
  background: #f3f4f6;
  color: #1a1a1a;
}

.cancel-button:hover {
  background: #e5e7eb;
}

.upload-button {
  background: #1a1a1a;
  color: white;
}

.upload-button:hover:not(:disabled) {
  background: #2d2d2d;
}

.upload-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
