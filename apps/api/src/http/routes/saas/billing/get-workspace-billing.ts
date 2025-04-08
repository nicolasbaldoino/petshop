import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function getWorkspaceBilling(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/workspaces/:slug/billing',
      {
        schema: {
          tags: ['[SaaS] Billing'],
          summary: 'Get billing information from workspace',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              billing: z.object({}),
            }),
          },
        },
      },
      async (request) => {
        const { slug } = request.params
        const { workspace } = await request.getCurrentUser(slug)

        const [amountOfEmployees, amountOfCustomers] =
          await prisma.$transaction([
            prisma.employee.count({
              where: {
                workspaceId: workspace.id,
              },
            }),
            prisma.customer.count({
              where: {
                workspaceId: workspace.id,
              },
            }),
          ])

        console.log('Amount of employees:', amountOfEmployees)
        console.log('Amount of customers:', amountOfCustomers)

        return {
          billing: {},
        }
      },
    )
}
