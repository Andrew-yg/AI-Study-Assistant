<template>
  <div class="callback-page">
    <div class="loading-container">
      <div class="spinner"></div>
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const { setAuthToken, initAuth } = useAuth()
const message = ref('Signing you in...')

onMounted(async () => {
  const token = route.query.token as string
  const error = route.query.error as string

  if (error) {
    message.value = 'Authentication failed. Redirecting...'
    setTimeout(() => {
      router.push('/')
    }, 2000)
    return
  }

  if (token) {
    // Store token
    setAuthToken(token)
    
    // Initialize auth to fetch user data
    await initAuth()
    
    message.value = 'Success! Redirecting...'
    
    // Redirect to chat
    setTimeout(() => {
      router.push('/chat')
    }, 1000)
  } else {
    message.value = 'No token received. Redirecting...'
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }
})
</script>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
}

.loading-container {
  text-align: center;
  color: white;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container p {
  font-size: 1.1rem;
  color: #9ca3af;
}
</style>
