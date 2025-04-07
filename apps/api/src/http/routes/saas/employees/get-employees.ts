import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function getEmployees(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/workspaces/:slug/employees',
      {
        schema: {
          tags: ['[SaaS] Employees'],
          summary: 'Get all workspace employees',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              employees: z.array(
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

        const employees = await prisma.employee.findMany({
          select: {
            id: true,
            name: true,
            workspaceId: true,
            createdAt: true,
          },
          where: {
            workspaceId: workspace.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return reply.send({ employees })
      },
    )
}
