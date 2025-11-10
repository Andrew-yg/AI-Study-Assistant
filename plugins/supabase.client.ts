import { createBrowserClient } from '@supabase/ssr'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const supabaseUrl = config.public.supabaseUrl as string
  const supabaseAnonKey = config.public.supabaseAnonKey as string

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be provided')
  }

  const supabase = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
          return cookie ? decodeURIComponent(cookie.split('=')[1]) : null
        },
        set(name: string, value: string, options: any) {
          let cookieStr = `${name}=${encodeURIComponent(value)}`
          if (options?.maxAge) cookieStr += `; max-age=${options.maxAge}`
          if (options?.path) cookieStr += `; path=${options.path}`
          if (options?.sameSite) cookieStr += `; samesite=${options.sameSite}`
          document.cookie = cookieStr
        },
        remove(name: string, options: any) {
          document.cookie = `${name}=; path=${options?.path || '/'}; max-age=0`
        },
      },
    }
  )

  return {
    provide: {
      supabase
    }
  }
})
