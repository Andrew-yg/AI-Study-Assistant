<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Edit Material</h3>
        <button @click="$emit('close')" class="close-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSave" class="edit-form">
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

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="cancel-button">Cancel</button>
          <button type="submit" :disabled="!isFormValid || saving" class="save-button">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
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

const props = defineProps<{
  material: LearningMaterial
}>()

const emit = defineEmits(['close', 'save'])

const saving = ref(false)

const formData = ref({
  courseName: props.material.courseName,
  materialType: props.material.materialType,
  description: props.material.description
})

const isFormValid = computed(() => {
  return formData.value.courseName.trim() && formData.value.materialType
})

const handleSave = async () => {
  if (!isFormValid.value) return

  saving.value = true
  try {
    emit('save', props.material.id, {
      courseName: formData.value.courseName.trim(),
      materialType: formData.value.materialType,
      description: formData.value.description.trim()
    })
  } finally {
    saving.value = false
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

.edit-form {
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

.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.cancel-button,
.save-button {
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

.save-button {
  background: #1a1a1a;
  color: white;
}

.save-button:hover:not(:disabled) {
  background: #2d2d2d;
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .modal-content {
    padding: 1.25rem;
    max-width: 100%;
  }

  .modal-header h3 {
    font-size: 1.125rem;
  }

  .edit-form {
    gap: 1rem;
  }

  .form-section {
    gap: 0.375rem;
  }

  .form-label {
    font-size: 0.8125rem;
  }

  .form-input,
  .form-select,
  .form-textarea {
    padding: 0.625rem;
    font-size: 0.9375rem;
  }

  .modal-footer {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }

  .cancel-button,
  .save-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .modal-content {
    padding: 1rem;
  }

  .modal-header {
    margin-bottom: 1rem;
  }
}
</style>
