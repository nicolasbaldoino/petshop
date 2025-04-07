import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'

export async function updateWorkspace(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/workspaces/:slug',
      {
        schema: {
          tags: ['[SaaS] Workspaces'],
          summary: 'Update workspace details',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
          }),
          params: z.object({
            slug: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const { workspace } = await request.getCurrentUser(slug)

        if (!workspace) {
          throw new BadRequestError('Workspace not found')
        }

        const { name } = request.body

        await prisma.workspace.update({
          where: {
            id: workspace.id,
          },
          data: {
            name,
          },
        })

        return reply.status(204).send()
      },
    )
}
