export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  
  googleAuthUrl.searchParams.set('client_id', config.googleClientId)
  googleAuthUrl.searchParams.set('redirect_uri', `${config.public.baseUrl}/api/auth/google/callback`)
  googleAuthUrl.searchParams.set('response_type', 'code')
  googleAuthUrl.searchParams.set('scope', 'openid email profile')
  googleAuthUrl.searchParams.set('access_type', 'offline')
  googleAuthUrl.searchParams.set('prompt', 'select_account') // 允许选择账户

  return sendRedirect(event, googleAuthUrl.toString())
})
