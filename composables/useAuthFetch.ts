/**
 * Create authenticated fetch with JWT token
 */
export const useAuthFetch = () => {
  const { token } = useAuth()

  return <T = any>(url: string, options: any = {}) => {
    const headers = options.headers || {}
    
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }

    return $fetch<T>(url, {
      ...options,
      headers
    })
  }
}
