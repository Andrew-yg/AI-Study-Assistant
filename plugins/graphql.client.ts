import { Client, cacheExchange, fetchExchange } from '@urql/vue'

export default defineNuxtPlugin((nuxtApp) => {
    const { token } = useAuth()
    const config = useRuntimeConfig()

    const client = new Client({
        url: `${config.public.baseUrl}/api/graphql`,
        exchanges: [cacheExchange, fetchExchange],
        fetchOptions: () => {
            return {
                headers: {
                    authorization: token.value ? `Bearer ${token.value}` : '',
                },
            }
        },
    })

    nuxtApp.provide('urql', client)
})
