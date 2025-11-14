// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Private keys (server-side only)
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    r2BucketName: process.env.R2_BUCKET_NAME,
  ragServiceUrl: process.env.RAG_SERVICE_URL || 'http://localhost:8001',
  agentServiceUrl: process.env.AGENT_SERVICE_URL || 'http://localhost:8002',
  quizServiceUrl: process.env.QUIZ_SERVICE_URL || 'http://localhost:8003',
    
    // Public keys (client-side accessible)
    public: {
      baseUrl: process.env.BASE_URL || 'http://localhost:3000'
    }
  }
})
