<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="close-button" @click="$emit('close')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div class="modal-header">
        <div class="brand">
          <span class="logo-icon">⚡️</span>
          <h2 class="brand-name">PersonalizedForYou</h2>
        </div>
        <p class="modal-description">
          {{ isLogin ? 'Welcome back! Sign in to your account' : 'Create an account to get started' }}
        </p>
      </div>

      <div class="auth-form">
        <div class="input-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter your email"
            @keyup.enter="handleAuth"
          />
        </div>

        <div class="input-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your password"
            @keyup.enter="handleAuth"
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button @click="handleAuth" :disabled="loading" class="auth-button">
          {{ loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up') }}
        </button>

        <div class="toggle-mode">
          <span v-if="isLogin">
            Don't have an account?
            <button @click="isLogin = false" class="link-button">Sign up</button>
          </span>
          <span v-else>
            Already have an account?
            <button @click="isLogin = true" class="link-button">Sign in</button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $supabase } = useNuxtApp()
const router = useRouter()

const emit = defineEmits(['close'])

const email = ref('')
const password = ref('')
const isLogin = ref(true)
const loading = ref(false)
const error = ref('')

const handleAuth = async () => {
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields'
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (isLogin.value) {
      const { data, error: authError } = await $supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })

      if (authError) throw authError

      if (data.user) {
        await router.push('/chat')
        emit('close')
      }
    } else {
      const { data, error: authError } = await $supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })

      if (authError) throw authError

      if (data.user) {
        await $supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
        })

        await router.push('/chat')
        emit('close')
      }
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred'
  } finally {
    loading.value = false
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
  background: #1a1a1a;
  border-radius: 1rem;
  width: 100%;
  max-width: 450px;
  padding: 2.5rem;
  position: relative;
  color: white;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #9ca3af;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-button:hover {
  color: white;
}

.modal-header {
  text-align: center;
  margin-bottom: 2rem;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.logo-icon {
  font-size: 2rem;
}

.brand-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.modal-description {
  color: #9ca3af;
  font-size: 0.95rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  color: #e5e7eb;
  font-size: 0.875rem;
  font-weight: 500;
}

.input-group input {
  padding: 0.75rem 1rem;
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 0.5rem;
  color: white;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: #3b82f6;
}

.input-group input::placeholder {
  color: #6b7280;
}

.error-message {
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  color: #fca5a5;
  font-size: 0.875rem;
}

.auth-button {
  padding: 0.875rem;
  background: white;
  color: #1a1a1a;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.2s;
}

.auth-button:hover:not(:disabled) {
  background: #f3f4f6;
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-mode {
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
}

.link-button {
  background: none;
  border: none;
  color: #3b82f6;
  font-weight: 600;
  padding: 0;
  margin-left: 0.25rem;
}

.link-button:hover {
  text-decoration: underline;
}
</style>
