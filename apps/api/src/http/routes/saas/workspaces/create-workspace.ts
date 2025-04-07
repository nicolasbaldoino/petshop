import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/utils/create-slug'

import { BadRequestError } from '../../_errors/bad-request-error'

export async function createWorkspace(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/workspaces',
      {
        schema: {
          tags: ['[SaaS] Workspaces'],
          summary: 'Create a new workspace',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
          }),
          response: {
            201: z.object({
              workspaceId: z.string().uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getAuthenticatedUserId()

        const { name } = request.body

        const workspaceByOnwer = await prisma.workspace.findUnique({
          where: {
            ownerId: userId,
          },
        })

        if (workspaceByOnwer) {
          throw new BadRequestError('This user already has a workspace')
        }

        const workspace = await prisma.workspace.create({
          data: {
            name,
            slug: createSlug(name),
            ownerId: userId,
          },
        })

        return reply.status(201).send({
          workspaceId: workspace.id,
        })
      },
    )
}
