import urql, { cacheExchange, createClient, fetchExchange } from '@urql/vue'

export default defineNuxtPlugin((nuxtApp) => {
    const { token } = useAuth()
    const config = useRuntimeConfig()

    const client = createClient({
        url: `${config.public.baseUrl}/api/graphql`,
        exchanges: [cacheExchange, fetchExchange],
        fetchOptions: () => ({
            headers: {
                authorization: token.value ? `Bearer ${token.value}` : '',
            },
        }),
    })

    // Register the urql plugin so useQuery/useMutation can resolve the client instance
    nuxtApp.vueApp.use(urql, client)

    // Also expose the client via Nuxt inject for any direct accesses
    nuxtApp.provide('urql', client)
})
