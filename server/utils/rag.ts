import type { Buffer } from 'node:buffer'

import type { ILearningMaterial } from '~/server/models/LearningMaterial'

interface RagProcessResponse {
  status: string
  material_id: string
  user_id: string
  filename: string
  documents: number
  chunk_size: number
}

interface RagQueryResponse {
  answer: string
  sources: Array<{
    snippet: string
    score: number
    metadata: Record<string, any>
  }>
  confidence: number
}

export async function processMaterialWithRag(material: ILearningMaterial, fileBuffer: Buffer) {
  const config = useRuntimeConfig()

  if (!config.ragServiceUrl) {
    throw new Error('RAG service URL is not configured')
  }

  const formData = new FormData()
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  ) as ArrayBuffer
  const uint8Array = new Uint8Array(arrayBuffer)
  const blob = new Blob([uint8Array], { type: 'application/pdf' })

  formData.append('file', blob, material.originalFilename)
  formData.append('material_id', material._id?.toString() || '')
  formData.append('user_id', material.userId.toString())

  return await $fetch<RagProcessResponse>(`${config.ragServiceUrl}/process`, {
    method: 'POST',
    body: formData,
  })
}

export async function queryRag(params: { question: string; userId: string; materialIds?: string[]; topK?: number }) {
  const config = useRuntimeConfig()

  if (!config.ragServiceUrl) {
    throw new Error('RAG service URL is not configured')
  }

  const { question, userId, materialIds, topK = 5 } = params

  return await $fetch<RagQueryResponse>(`${config.ragServiceUrl}/query`, {
    method: 'POST',
    body: {
      question,
      user_id: userId,
      material_ids: materialIds,
      top_k: topK,
    },
  })
}
