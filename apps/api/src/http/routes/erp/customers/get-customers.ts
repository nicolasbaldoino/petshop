import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function getCustomers(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/workspaces/:slug/customers',
      {
        schema: {
          tags: ['[ERP] Customers'],
          summary: 'Get all workspace customers',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              customers: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  workspaceId: z.string().uuid(),
                  createdAt: z.date(),
                }),
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const { workspace } = await request.getCurrentUser(slug)

        const customers = await prisma.customer.findMany({
          where: {
            workspaceId: workspace.id,
          },
          select: {
            id: true,
            name: true,
            workspaceId: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return reply.send({ customers })
      },
    )
}
