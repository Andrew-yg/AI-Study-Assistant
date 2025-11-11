import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)
    
    return {
      success: true,
      user
    }
  } catch (error: any) {
    throw createError({
      statusCode: 401,
      message: error.message || 'Unauthorized'
    })
  }
})
