import { SystemType } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'

export async function updateCustomer(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/workspaces/:slug/customers/:customerId',
      {
        schema: {
          tags: ['[SaaS] Customers'],
          summary: 'Update a customer',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            email: z.string().email(),
          }),
          params: z.object({
            slug: z.string(),
            customerId: z.string().uuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug, customerId } = request.params
        const { workspace } = await request.getCurrentUser(slug)

        const customer = await prisma.customer.findUnique({
          where: {
            id: customerId,
            workspaceId: workspace.id,
          },
          include: {
            user: true,
          },
        })

        if (!customer) {
          throw new BadRequestError('Customer not found.')
        }

        const { name, email } = request.body

        const userByEmail = await prisma.user.findFirst({
          where: {
            workspaceId: workspace.id,
            email,
            systemType: SystemType.PORTAL,
            id: {
              not: customer.userId,
            },
          },
        })

        if (userByEmail) {
          throw new UnauthorizedError('Email already exists.')
        }

        await prisma.user.update({
          where: {
            id: customer.userId,
          },
          data: {
            email,
          },
        })

        await prisma.customer.update({
          where: {
            id: customer.id,
          },
          data: {
            name,
          },
        })

        if (customer.user?.email !== email) {
          // TODO: Send email to user with updated login credentials
        }

        return reply.status(204).send()
      },
    )
}
