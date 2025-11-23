import { createYoga } from 'graphql-yoga'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { typeDefs } from '../graphql/schema'
import { resolvers } from '../graphql/resolvers'
import { createContext } from '../graphql/context'

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
})

const yoga = createYoga({
    schema,
    graphqlEndpoint: '/api/graphql',
    context: async ({ request }) => {
        // Extract H3 event from the Nuxt request
        const event = (request as any).__event

        if (!event) {
            throw new Error('Event not found in request context')
        }

        return createContext(event)
    },
    // Enable GraphiQL in development
    graphiql: process.env.NODE_ENV !== 'production',
})

export default defineEventHandler(async (event) => {
    // Attach event to request for context access
    const request = event.node.req as any
    request.__event = event

    // Handle the request with Yoga
    const response = await yoga.fetch(
        new Request(
            `http://localhost:3000${event.path}`,
            {
                method: event.method,
                headers: event.headers as any,
                body: event.method !== 'GET' && event.method !== 'HEAD'
                    ? await readRawBody(event)
                    : undefined,
            }
        ),
        {
            request: request as any,
        }
    )

    // Set response headers
    response.headers.forEach((value, key) => {
        setHeader(event, key, value)
    })

    // Set status code
    setResponseStatus(event, response.status)

    // Return response body
    return response.text()
})
