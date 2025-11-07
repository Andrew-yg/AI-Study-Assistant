<template>
  <div class="landing-page">
    <nav class="navbar">
      <div class="nav-content">
        <div class="nav-left">
          <span class="logo-icon">⚡️</span>
          <div class="brand-text">
            <h1 class="brand-name">PersonalizedForYou</h1>
            <p class="brand-subtitle">Customized AI Assistant</p>
          </div>
        </div>
        <div class="nav-right"></div>
      </div>
    </nav>

    <div class="background-logos">
      <img src="/OpenAI_Logo.svg.png" alt="OpenAI" class="logo-image logo-openai" />
      <img src="/Google-Gemini-Logo.png" alt="Gemini" class="logo-image logo-gemini" />
      <img src="/deepseek-color.png" alt="DeepSeek" class="logo-image logo-deepseek" />
    </div>

    <main class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          <div class="title-line">Turn your lecture notes into</div>
          <div class="title-line gradient-text">AI-generated & searched</div>
          <div class="title-line">practice exams for your specific class</div>
        </h1>
        <p class="hero-subtitle">
          The AI platform that builds custom quizzes directly from your uploaded materials.
        </p>
        <div class="cta-buttons">
          <button @click="showAuthModal = true" class="btn btn-primary">Log In</button>
          <button @click="showAuthModal = true" class="btn btn-secondary">Sign Up</button>
        </div>
      </div>
    </main>

    <AuthModal v-if="showAuthModal" @close="showAuthModal = false" @auth-success="handleAuthSuccess" />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { user } = useAuth()
const showAuthModal = ref(false)

watchEffect(() => {
  if (user.value) {
    router.push('/chat')
  }
})

const handleAuthSuccess = () => {
  showAuthModal.value = false
  router.push('/chat')
}
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  position: relative;
  overflow: hidden;
}

.background-logos {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.logo-image {
  position: absolute;
  opacity: 0.15;
  filter: blur(1px);
  user-select: none;
}

.logo-openai {
  width: 450px;
  height: auto;
  top: 15%;
  left: 8%;
  transform: rotate(-12deg);
}

.logo-gemini {
  width: 500px;
  height: auto;
  bottom: 12%;
  right: 10%;
  transform: rotate(8deg);
}

.logo-deepseek {
  width: 400px;
  height: auto;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-5deg);
}

.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 2rem;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 400;
  line-height: 1.2;
}

.hero-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 8rem 2rem 4rem;
  text-align: center;
  position: relative;
  z-index: 1;
}

.hero-content {
  max-width: 900px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.title-line {
  color: #1a1a1a;
}

.gradient-text {
  background: linear-gradient(135deg, #2563eb 0%, #8b5cf6 50%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 3rem;
  font-weight: 400;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.btn {
  padding: 0.875rem 2.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2d2d2d 0%, #404040 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  opacity: 0.95;
}

.btn-secondary {
  background: white;
  color: #1a1a1a;
  border: 2px solid #e5e7eb;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
  opacity: 0.95;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .cta-buttons {
    flex-direction: column;
    width: 100%;
  }

  .btn {
    width: 100%;
  }
}
</style>
