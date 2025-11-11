export default defineEventHandler(async (event) => {
  // On client-side, localStorage will be cleared
  // This endpoint just confirms logout
  return {
    success: true,
    message: 'Logged out successfully'
  }
})
