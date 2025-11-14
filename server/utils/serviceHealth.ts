import { createError } from 'h3'

const SERVICE_KEY_MAP = {
  rag: 'ragServiceUrl',
  agent: 'agentServiceUrl',
  quiz: 'quizServiceUrl',
} as const

type ServiceName = keyof typeof SERVICE_KEY_MAP

const DISPLAY_NAME: Record<ServiceName, string> = {
  rag: 'RAG service',
  agent: 'Agent service',
  quiz: 'Quiz service',
}

interface HealthCacheEntry {
  timestamp: number
  healthy: boolean
}

const healthCache = new Map<ServiceName, HealthCacheEntry>()

const HEALTH_TTL_MS = 5000

export async function ensureServiceHealthy(service: ServiceName, options?: { timeoutMs?: number }) {
  const config = useRuntimeConfig()
  const configKey = SERVICE_KEY_MAP[service]
  const baseUrl = (config as any)[configKey] as string | undefined

  if (!baseUrl) {
    throw createError({
      statusCode: 500,
      message: `${DISPLAY_NAME[service]} URL is missing from runtime config`,
    })
  }

  const now = Date.now()
  const cached = healthCache.get(service)
  if (cached && cached.healthy && now - cached.timestamp < HEALTH_TTL_MS) {
    return
  }

  const url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

  try {
    const response = await $fetch<{ status?: string }>(`${url}/health`, {
      timeout: options?.timeoutMs ?? 4000,
    })

    if (response?.status !== 'healthy') {
      throw new Error(`Unexpected health response: ${JSON.stringify(response)}`)
    }

    healthCache.set(service, { healthy: true, timestamp: now })
  } catch (error: any) {
    healthCache.set(service, { healthy: false, timestamp: now })
    throw createError({
      statusCode: 503,
      message: `${DISPLAY_NAME[service]} is unavailable. Start it with \"npm run dev:${service}\" or use \"npm run dev\" to launch the full stack.`,
      data: {
        service,
        serviceUrl: baseUrl,
        reason: error?.message,
      },
    })
  }
}
