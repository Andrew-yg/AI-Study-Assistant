import { connectDB } from '~/server/utils/mongodb'
import { User } from '~/server/models/User'
import { generateToken } from '~/server/utils/auth'

interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
  id_token: string
}

interface GoogleUserInfo {
  id?: string // Google API v2 uses 'id'
  sub?: string // Google API v3 uses 'sub'
  email: string
  name: string
  picture?: string
  verified_email?: boolean
  email_verified?: boolean
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  const code = query.code as string
  
  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Authorization code not provided'
    })
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await $fetch<GoogleTokenResponse>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: {
        code,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: `${config.public.baseUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code'
      }
    })

    // Get user info from Google
    const userInfo = await $fetch<GoogleUserInfo>('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`
      }
    })

    console.log('[Auth] Google user info received:', JSON.stringify(userInfo, null, 2))

    // Extract Google ID (supports both API v2 'id' and v3 'sub')
    const googleId = userInfo.sub || userInfo.id

    // Validate required fields
    if (!googleId) {
      console.error('[Auth] Missing Google ID in user info')
      throw new Error('Invalid user info: missing Google ID')
    }

    if (!userInfo.email) {
      console.error('[Auth] Missing email in user info')
      throw new Error('Invalid user info: missing email')
    }

    // Connect to database
    await connectDB()

    // Find or create user
    let user = await User.findOne({ googleId })

    if (!user) {
      console.log('[Auth] Creating new user with data:', {
        googleId,
        email: userInfo.email,
        name: userInfo.name
      })
      
      user = await User.create({
        googleId,
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture
      })
      console.log('[Auth] Created new user:', user._id)
    } else {
      // Update user info if changed
      user.name = userInfo.name
      user.avatar = userInfo.picture
      await user.save()
      console.log('[Auth] Updated existing user:', user._id)
    }

    // Generate JWT token
    const token = generateToken(user._id!.toString(), user.email)

    // Redirect to frontend with token
    const redirectUrl = new URL(config.public.baseUrl)
    redirectUrl.pathname = '/auth/callback'
    redirectUrl.searchParams.set('token', token)

    return sendRedirect(event, redirectUrl.toString())
    
  } catch (error: any) {
    console.error('[Auth] Google OAuth callback error:', error)
    
    const errorUrl = new URL(config.public.baseUrl)
    errorUrl.searchParams.set('error', 'auth_failed')
    
    return sendRedirect(event, errorUrl.toString())
  }
})
