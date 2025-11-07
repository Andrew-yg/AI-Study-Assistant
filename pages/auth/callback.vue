<template>
  <div class="callback-page">
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Completing authentication...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()

onMounted(async () => {
  try {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const error = hashParams.get('error')
    const errorDescription = hashParams.get('error_description')

    if (error) {
      console.error('OAuth error:', error, errorDescription)
      router.push('/')
      return
    }

    if (accessToken) {
      await router.push('/chat')
    } else {
      router.push('/')
    }
  } catch (error) {
    console.error('Callback error:', error)
    router.push('/')
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
