<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Upload PDF</h3>
        <button @click="$emit('close')" class="close-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

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

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="cancel-button">Cancel</button>
        <button @click="handleUpload" :disabled="!selectedFile || uploading" class="upload-button">
          {{ uploading ? 'Uploading...' : 'Upload' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['close', 'upload'])

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const error = ref('')

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
  if (!selectedFile.value) return

  uploading.value = true
  error.value = ''

  try {
    emit('upload', selectedFile.value)
  } catch (err: any) {
    error.value = err.message || 'Upload failed'
  } finally {
    uploading.value = false
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
  max-width: 500px;
  padding: 1.5rem;
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

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  margin-bottom: 1rem;
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
  margin-bottom: 1rem;
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
