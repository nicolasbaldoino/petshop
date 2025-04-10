import { SystemType } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'

export async function updateEmployee(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/workspaces/:slug/employees/:employeeId',
      {
        schema: {
          tags: ['[SaaS] Employees'],
          summary: 'Update a employee',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            email: z.string().email(),
          }),
          params: z.object({
            slug: z.string(),
            employeeId: z.string().uuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug, employeeId } = request.params
        const { workspace } = await request.getCurrentUser(slug)

        const employee = await prisma.employee.findUnique({
          where: {
            id: employeeId,
            workspaceId: workspace.id,
          },
          include: {
            user: true,
          },
        })

        if (!employee) {
          throw new BadRequestError('Employee not found.')
        }

        const { name, email } = request.body

        const userByEmail = await prisma.user.findFirst({
          where: {
            workspaceId: workspace.id,
            email,
            systemType: SystemType.ERP,
            id: {
              not: employee.userId,
            },
          },
        })

        if (userByEmail) {
          throw new UnauthorizedError('Email already exists.')
        }

        await prisma.user.update({
          where: {
            id: employee.userId,
          },
          data: {
            email,
          },
        })

        await prisma.employee.update({
          where: {
            id: employee.id,
          },
          data: {
            name,
          },
        })

        if (employee.user?.email !== email) {
          // TODO: Send email to user with updated login credentials
        }

        return reply.status(204).send()
      },
    )
}
