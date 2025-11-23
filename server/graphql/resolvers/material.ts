import mongoose from 'mongoose'
import type { GraphQLContext } from '../context'
import { LearningMaterial } from '~/server/models/LearningMaterial'

export const materialResolvers = {
    Query: {
        // Fetch materials with optional conversation filter
        materials: async (
            _parent: any,
            args: { conversationId?: string },
            context: GraphQLContext
        ) => {
            const filter: any = { userId: context.userId }

            if (args.conversationId) {
                if (!mongoose.Types.ObjectId.isValid(args.conversationId)) {
                    throw new Error('Invalid conversation ID')
                }
                filter.conversationId = new mongoose.Types.ObjectId(args.conversationId)
            }

            const materials = await LearningMaterial.find(filter)
                .sort({ createdAt: -1 })
                .lean()

            return materials.map((mat: any) => ({
                id: mat._id.toString(),
                userId: mat.userId.toString(),
                conversationId: mat.conversationId?.toString() || null,
                courseName: mat.courseName,
                materialType: mat.materialType,
                description: mat.description,
                filePath: mat.filePath,
                fileSize: mat.fileSize,
                originalFilename: mat.originalFilename,
                processingStatus: mat.processingStatus,
                createdAt: mat.createdAt.toISOString(),
                updatedAt: mat.updatedAt.toISOString(),
            }))
        },

        // Fetch material by ID
        material: async (_parent: any, args: { id: string }, context: GraphQLContext) => {
            if (!mongoose.Types.ObjectId.isValid(args.id)) {
                throw new Error('Invalid material ID')
            }

            const material = await LearningMaterial.findOne({
                _id: args.id,
                userId: context.userId,
            }).lean()

            if (!material) {
                return null
            }

            return {
                id: material._id.toString(),
                userId: material.userId.toString(),
                conversationId: material.conversationId?.toString() || null,
                courseName: material.courseName,
                materialType: material.materialType,
                description: material.description,
                filePath: material.filePath,
                fileSize: material.fileSize,
                originalFilename: material.originalFilename,
                processingStatus: material.processingStatus,
                createdAt: material.createdAt.toISOString(),
                updatedAt: material.updatedAt.toISOString(),
            }
        },
    },
}
