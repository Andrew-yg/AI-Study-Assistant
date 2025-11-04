export default defineNuxtRouteMiddleware(async (to, from) => {
  const { $supabase } = useNuxtApp()

  const { data: { session } } = await $supabase.auth.getSession()

  if (!session) {
    return navigateTo('/')
  }
})
