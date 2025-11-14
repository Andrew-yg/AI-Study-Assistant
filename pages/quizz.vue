<template>
  <div class="practice-layout">
    <header class="practice-header">
      <div>
        <p class="eyebrow">Practice drills</p>
        <h1>{{ conversationTitle || 'Practice quizzes' }}</h1>
        <p class="header-subtitle">
          Review the quizzes linked to your chats, answer questions, and let the agent grade your work.
        </p>
      </div>
      <div class="header-actions">
        <NuxtLink
          class="ghost-button"
          :to="{ path: '/chat', query: currentConversationId ? { conversationId: currentConversationId } : undefined }"
        >
          ← Back to chat
        </NuxtLink>
        <button class="ghost-button" type="button" @click="reloadQuiz" :disabled="loadingQuiz">
          {{ loadingQuiz ? 'Refreshing...' : 'Reload quiz' }}
        </button>
      </div>
    </header>

    <div class="practice-grid">
      <aside v-if="currentConversationId" class="practice-sidebar">
        <div class="sidebar-head">
          <h3>Saved quizzes</h3>
          <button class="sidebar-refresh" type="button" :disabled="listLoading" @click="loadAvailableQuizzes">
            {{ listLoading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
        <p v-if="!listLoading && !availableQuizzes.length" class="sidebar-empty">
          Generate a practice quiz inside the chat to see it here.
        </p>
        <ul class="quiz-nav-list" v-else>
          <li v-for="savedQuiz in availableQuizzes" :key="savedQuiz.id">
            <button
              class="quiz-nav-item"
              :class="{ active: savedQuiz.id === quiz?.id }"
              type="button"
              @click="selectQuiz(savedQuiz.id)"
            >
              <span class="quiz-nav-title">
                {{ savedQuiz.count }} questions · {{ formatQuestionType(savedQuiz.questionType) }}
              </span>
              <span class="quiz-nav-meta">
                {{ savedQuiz.difficulty }} · {{ formatDateTime(savedQuiz.updatedAt || savedQuiz.createdAt) }}
              </span>
            </button>
          </li>
        </ul>
      </aside>

      <section class="practice-main">
        <div v-if="loadingQuiz" class="practice-state">Loading quiz…</div>
        <div v-else-if="errorMessage" class="practice-state error">
          <p>{{ errorMessage }}</p>
          <NuxtLink class="ghost-button" to="/chat">Return to chat</NuxtLink>
        </div>
        <div v-else-if="!quiz" class="practice-state">
          Select a quiz from the left or create one inside the chat view.
        </div>
        <div v-else class="quiz-content">
          <div class="quiz-overview">
            <div>
              <p class="quiz-pill">{{ formatQuestionType(quiz.questionType) }}</p>
              <h2>{{ quiz.count }} question{{ quiz.count === 1 ? '' : 's' }}</h2>
              <p class="quiz-muted">Updated {{ formatDateTime(quiz.updatedAt || quiz.createdAt) }}</p>
            </div>
            <div class="quiz-overview-stats">
              <div>
                <p class="stat-label">Difficulty</p>
                <p class="stat-value">{{ quiz.difficulty }}</p>
              </div>
              <div>
                <p class="stat-label">Status</p>
                <p class="stat-value">{{ quiz.status }}</p>
              </div>
              <div>
                <p class="stat-label">Answered</p>
                <p class="stat-value">{{ answeredCount }} / {{ quiz.questions.length }}</p>
              </div>
            </div>
          </div>

          <div class="answered-progress">
            <div class="progress-bar">
              <span :style="{ width: `${progressPercent}%` }"></span>
            </div>
            <p>{{ progressPercent }}% answered</p>
          </div>

          <div class="question-list">
            <article v-for="question in quiz.questions" :key="question.id" class="question-card">
              <div class="question-head">
                <span class="question-index">Question {{ question.order + 1 }}</span>
                <span class="question-type-pill">{{ formatQuestionType(question.questionType) }}</span>
              </div>
              <p class="question-text">{{ question.question }}</p>

              <div v-if="question.questionType === 'multiple_choice'" class="multiple-choice-grid">
                <label
                  v-for="option in question.options"
                  :key="option"
                  :class="['choice-option', getChoiceState(question.id, option)]"
                >
                  <input
                    type="radio"
                    :name="`question-${question.id}`"
                    :value="option"
                    :checked="answers[question.id] === option"
                    @change="setAnswer(question.id, option)"
                  />
                  <span>{{ option }}</span>
                </label>
              </div>

              <div v-else-if="question.questionType === 'true_false'" class="binary-options">
                <label
                  v-for="option in ['True', 'False']"
                  :key="option"
                  :class="['choice-option', getChoiceState(question.id, option)]"
                >
                  <input
                    type="radio"
                    :name="`question-${question.id}`"
                    :value="option"
                    :checked="answers[question.id] === option"
                    @change="setAnswer(question.id, option)"
                  />
                  <span>{{ option }}</span>
                </label>
              </div>

              <div v-else class="short-answer">
                <textarea
                  rows="4"
                  :value="answers[question.id] || ''"
                  placeholder="Write your response"
                  @input="onShortAnswerInput(question.id, $event)"
                ></textarea>
              </div>

              <transition name="fade">
                <div
                  v-if="getQuestionResult(question.id)"
                  :class="['question-feedback', getQuestionResult(question.id)?.isCorrect ? 'success' : 'error']"
                >
                  <p class="feedback-heading">
                    {{ getQuestionResult(question.id)?.isCorrect ? 'Great work — correct!' : 'Keep trying' }}
                  </p>
                  <p class="feedback-body">{{ getQuestionResult(question.id)?.feedback || 'AI feedback unavailable.' }}</p>
                  <p class="feedback-answer">
                    Correct answer: <strong>{{ getQuestionResult(question.id)?.correctAnswer }}</strong>
                  </p>
                </div>
              </transition>
            </article>
          </div>

          <div class="submit-panel">
            <div>
              <p class="submit-meta">{{ answeredCount }} / {{ quiz.questions.length }} answered</p>
              <p class="submit-meta" v-if="submissionResult">
                Last score: {{ Math.round((submissionResult.summary.score || 0) * 100) }}%
              </p>
            </div>
            <button class="submit-button" type="button" :disabled="submitting || answeredCount === 0" @click="submitQuiz">
              {{ submitting ? 'Evaluating…' : 'Submit for feedback' }}
            </button>
          </div>

          <div v-if="submissionResult" class="submission-summary">
            <div class="score-circle">{{ Math.round((submissionResult.summary.score || 0) * 100) }}%</div>
            <div>
              <p class="summary-heading">{{ submissionResult.summary.correct }} / {{ submissionResult.summary.total }} correct</p>
              <p class="summary-body">AI grading complete. Review the feedback above to keep improving.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PracticeQuiz, PracticeQuizQuestion } from '~/composables/usePracticeQuiz'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const practiceQuizAPI = usePracticeQuiz()
const conversationsAPI = useConversations()

const quiz = ref<PracticeQuiz | null>(null)
const availableQuizzes = ref<PracticeQuiz[]>([])
const loadingQuiz = ref(false)
const listLoading = ref(false)
const errorMessage = ref('')
const submitting = ref(false)
const submissionResult = ref<{ summary: PracticeQuiz['submissions'][number]['summary']; answers: PracticeQuiz['submissions'][number]['answers'] } | null>(null)
const answers = reactive<Record<string, string>>({})
const conversationTitle = ref('')

const currentConversationId = computed(() => typeof route.query.conversationId === 'string' ? route.query.conversationId : null)
const currentQuizId = computed(() => typeof route.query.quizId === 'string' ? route.query.quizId : null)

const answeredCount = computed(() => {
  if (!quiz.value) return 0
  const ids = quiz.value.questions.map((question) => question.id)
  return ids.filter((id) => (answers[id] || '').trim().length > 0).length
})

const progressPercent = computed(() => {
  if (!quiz.value || quiz.value.questions.length === 0) {
    return 0
  }
  return Math.round((answeredCount.value / quiz.value.questions.length) * 100)
})

const submissionAnswerMap = computed<Record<string, PracticeQuiz['submissions'][number]['answers'][number]>>(() => {
  if (!submissionResult.value) {
    return {}
  }
  return submissionResult.value.answers.reduce((acc, answer) => {
    acc[answer.questionId.toString()] = answer
    return acc
  }, {} as Record<string, PracticeQuiz['submissions'][number]['answers'][number]>)
})

const formatQuestionType = (type: PracticeQuizQuestion['questionType']) => {
  switch (type) {
    case 'multiple_choice':
      return 'Multiple choice'
    case 'true_false':
      return 'True / False'
    case 'short_answer':
      return 'Short answer'
    default:
      return type
  }
}

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const setAnswer = (questionId: string, value: string) => {
  answers[questionId] = value
}

const onShortAnswerInput = (questionId: string, event: Event) => {
  const target = event.target as HTMLTextAreaElement | null
  setAnswer(questionId, target?.value || '')
}

const getQuestionResult = (questionId: string) => submissionAnswerMap.value[questionId] || null

const getChoiceState = (questionId: string, option: string) => {
  const result = getQuestionResult(questionId)
  if (result) {
    if (result.correctAnswer === option) {
      return 'correct'
    }
    if (!result.isCorrect && result.userAnswer === option) {
      return 'selected'
    }
  }
  return answers[questionId] === option ? 'selected' : ''
}

const resetAnswers = (targetQuiz: PracticeQuiz) => {
  Object.keys(answers).forEach((key) => delete answers[key])
  targetQuiz.questions.forEach((question) => {
    answers[question.id] = ''
  })
  submissionResult.value = null
}

const loadConversationTitle = async () => {
  if (!currentConversationId.value) {
    conversationTitle.value = ''
    return
  }

  try {
    const conversations = await conversationsAPI.fetchConversations()
    const found = conversations.find((entry) => entry.id === currentConversationId.value)
    conversationTitle.value = found?.title || 'Practice quizzes'
  } catch (error) {
    console.error('[PracticeQuiz] Failed to load conversations', error)
    conversationTitle.value = 'Practice quizzes'
  }
}

const loadAvailableQuizzes = async () => {
  if (!currentConversationId.value) {
    availableQuizzes.value = []
    return
  }

  try {
    listLoading.value = true
    availableQuizzes.value = await practiceQuizAPI.fetchQuizzes({ conversationId: currentConversationId.value })
  } catch (error: any) {
    console.error('[PracticeQuiz] Failed to fetch saved quizzes:', error)
  } finally {
    listLoading.value = false
  }
}

const loadQuiz = async () => {
  loadingQuiz.value = true
  errorMessage.value = ''
  submissionResult.value = null
  try {
    let quizId = currentQuizId.value

    if (!quizId && currentConversationId.value) {
      if (!availableQuizzes.value.length) {
        await loadAvailableQuizzes()
      }
      quizId = availableQuizzes.value[0]?.id
      if (quizId) {
        router.replace({
          path: '/quizz',
          query: {
            conversationId: currentConversationId.value,
            quizId,
          },
        })
        return
      }
    }

    if (!quizId) {
      quiz.value = null
      errorMessage.value = 'No quiz selected. Generate one from the chat interface first.'
      return
    }

    const data = await practiceQuizAPI.fetchQuiz(quizId)
    quiz.value = data
    resetAnswers(data)
  } catch (error: any) {
    console.error('[PracticeQuiz] Failed to load quiz:', error)
    quiz.value = null
    errorMessage.value = error?.data?.message || error?.message || 'Unable to load quiz.'
  } finally {
    loadingQuiz.value = false
  }
}

const selectQuiz = (quizId: string) => {
  router.replace({
    path: '/quizz',
    query: {
      ...(currentConversationId.value ? { conversationId: currentConversationId.value } : {}),
      quizId,
    },
  })
}

const reloadQuiz = async () => {
  await loadAvailableQuizzes()
  await loadQuiz()
}

const submitQuiz = async () => {
  if (!quiz.value || submitting.value) {
    return
  }

  try {
    submitting.value = true
    const payload = quiz.value.questions.map((question) => ({
      questionId: question.id,
      answer: answers[question.id] || '',
    }))
    const response = await practiceQuizAPI.submitQuiz(quiz.value.id, { answers: payload })
    quiz.value = response.quiz
    submissionResult.value = response.submission
  } catch (error: any) {
    console.error('[PracticeQuiz] Submission failed:', error)
    alert(error?.data?.message || error?.message || 'Failed to evaluate quiz')
  } finally {
    submitting.value = false
  }
}

watch(() => route.query.quizId, () => {
  loadQuiz()
})

watch(() => route.query.conversationId, () => {
  loadAvailableQuizzes()
  loadConversationTitle()
  loadQuiz()
})

onMounted(async () => {
  await loadConversationTitle()
  await loadAvailableQuizzes()
  await loadQuiz()
})
</script>

<style scoped>
.practice-layout {
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.practice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0 0 0.25rem;
}

.practice-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #0f172a;
}

.header-subtitle {
  margin: 0.35rem 0 0;
  color: #475569;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.ghost-button {
  border: 1px solid #cbd5f5;
  border-radius: 999px;
  padding: 0.45rem 1rem;
  font-weight: 600;
  background: white;
  color: #1e293b;
  text-decoration: none;
  transition: background 0.2s, border-color 0.2s;
}

.ghost-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ghost-button:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.practice-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
}

.practice-sidebar {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-head h3 {
  margin: 0;
  font-size: 1rem;
  color: #0f172a;
}

.sidebar-refresh {
  border: none;
  background: #f1f5f9;
  border-radius: 0.5rem;
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.sidebar-empty {
  margin: 0;
  color: #94a3b8;
  font-size: 0.9rem;
}

.quiz-nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quiz-nav-item {
  width: 100%;
  text-align: left;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 0.85rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.quiz-nav-item.active {
  border-color: #6366f1;
  box-shadow: 0 5px 15px rgba(99, 102, 241, 0.15);
}

.quiz-nav-title {
  font-weight: 600;
  color: #0f172a;
}

.quiz-nav-meta {
  font-size: 0.85rem;
  color: #64748b;
}

.practice-main {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1.25rem;
  padding: 1.5rem;
  min-height: 60vh;
}

.practice-state {
  padding: 2rem;
  text-align: center;
  color: #475569;
}

.practice-state.error {
  color: #b91c1c;
}

.quiz-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.quiz-overview {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.quiz-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-weight: 600;
  font-size: 0.85rem;
}

.quiz-muted {
  margin: 0.35rem 0 0;
  color: #94a3b8;
}

.quiz-overview-stats {
  display: flex;
  gap: 1.25rem;
}

.stat-label {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}

.stat-value {
  margin: 0.2rem 0 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
}

.answered-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.progress-bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #34d399, #22d3ee);
  transition: width 0.3s ease;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-card {
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  background: #fafafa;
}

.question-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.question-index {
  font-weight: 600;
  color: #1f2937;
}

.question-type-pill {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  background: #e2e8f0;
  color: #475569;
}

.question-text {
  margin: 0;
  font-size: 1.05rem;
  color: #0f172a;
}

.multiple-choice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.binary-options {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.choice-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.9rem;
  padding: 0.6rem 0.75rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.choice-option input {
  accent-color: #111827;
}

.choice-option.selected {
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.choice-option.correct {
  border-color: #10b981;
  background: #ecfdf5;
}

.short-answer textarea {
  width: 100%;
  border-radius: 0.85rem;
  border: 1px solid #d1d5db;
  margin-top: 0.75rem;
  padding: 0.75rem;
  font-size: 1rem;
}

.question-feedback {
  margin-top: 0.75rem;
  border-radius: 0.85rem;
  padding: 0.75rem 1rem;
}

.question-feedback.success {
  background: #ecfdf5;
  border: 1px solid #6ee7b7;
  color: #065f46;
}

.question-feedback.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.feedback-heading {
  margin: 0 0 0.35rem;
  font-weight: 700;
}

.feedback-body {
  margin: 0 0 0.2rem;
}

.feedback-answer {
  margin: 0;
  font-size: 0.9rem;
}

.submit-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #0f172a;
  color: white;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
}

.submit-meta {
  margin: 0;
  font-size: 0.95rem;
}

.submit-button {
  border: none;
  border-radius: 999px;
  background: white;
  color: #0f172a;
  font-weight: 700;
  padding: 0.65rem 1.5rem;
  cursor: pointer;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submission-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid #d1fae5;
  background: #ecfdf5;
  border-radius: 1rem;
  padding: 1rem 1.25rem;
}

.score-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: white;
  border: 4px solid #34d399;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #059669;
}

.summary-heading {
  margin: 0;
  font-weight: 700;
  color: #065f46;
}

.summary-body {
  margin: 0.2rem 0 0;
  color: #047857;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .practice-grid {
    grid-template-columns: 1fr;
  }

  .practice-sidebar {
    order: 2;
  }

  .practice-main {
    order: 1;
  }
}

@media (max-width: 640px) {
  .practice-layout {
    padding: 1.25rem;
  }

  .practice-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .submit-panel {
    flex-direction: column;
    gap: 0.75rem;
  }

  .multiple-choice-grid {
    grid-template-columns: 1fr;
  }
}
</style>
