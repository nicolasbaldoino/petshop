import { SystemType } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'

export async function createEmployee(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/workspaces/:slug/employees',
      {
        schema: {
          tags: ['[SaaS] Employees'],
          summary: 'Create a new employee',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            email: z.string().email(),
          }),
          params: z.object({
            slug: z.string(),
          }),
          response: {
            201: z.object({
              employeeId: z.string().uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const { workspace } = await request.getCurrentUser(slug)

        const { name, email } = request.body

        const userByEmail = await prisma.user.findUnique({
          where: {
            workspaceId_email_systemType: {
              workspaceId: workspace.id,
              email,
              systemType: SystemType.ERP,
            },
          },
        })

        if (userByEmail) {
          throw new UnauthorizedError('Email already exists.')
        }

        const user = await prisma.user.create({
          data: {
            email,
            workspaceId: workspace.id,
            systemType: SystemType.ERP,
          },
        })

        const employee = await prisma.employee.create({
          data: {
            name,
            workspaceId: workspace.id,
            userId: user.id,
          },
        })

        // TODO: Send email to user with login credentials

        return reply.status(201).send({
          employeeId: employee.id,
        })
      },
    )
}
