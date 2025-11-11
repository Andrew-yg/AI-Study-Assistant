import { connectDB } from '~/server/utils/mongodb'

export default defineEventHandler(async () => {
  try {
    await connectDB()
    
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    return {
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
})
