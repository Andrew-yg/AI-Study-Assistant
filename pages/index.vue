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

    <main class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          Turn your lecture notes into <span class="gradient-text">AI-generated & searched</span> practice exams for your specific class.
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

    <AuthModal v-if="showAuthModal" @close="showAuthModal = false" />
  </div>
</template>

<script setup lang="ts">
const showAuthModal = ref(false)
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.navbar {
  background: white;
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
}

.hero-content {
  max-width: 900px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: #1a1a1a;
  margin-bottom: 1.5rem;
}

.gradient-text {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
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
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #1a1a1a;
  color: white;
}

.btn-primary:hover {
  background: #2d2d2d;
  transform: translateY(-1px);
}

.btn-secondary {
  background: white;
  color: #1a1a1a;
  border: 2px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
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
