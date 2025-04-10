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
          tags: ['[ERP] Employees'],
          summary: 'Create a new employee',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            email: z.string().email(),
            avatarUrl: z.string().url().nullish(),
            corporateEmail: z.string().nullish(),
            phone: z.string().nullish(),
            whatsapp: z.string().nullish(),
            crmv: z.string().nullish(),
            address: z
              .object({
                street: z.string().nullish(),
                number: z.string().nullish(),
                complement: z.string().nullish(),
                neighborhood: z.string().nullish(),
                city: z.string().nullish(),
                state: z.string().nullish(),
                country: z.string().nullish(),
                zipCode: z.string().nullish(),
                reference: z.string().nullish(),
              })
              .nullish(),
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

        const { name, email, ...data } = request.body

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
            workspaceId: workspace.id,
            email,
            systemType: SystemType.ERP,
          },
        })

        const address = await prisma.address.create({
          data: {
            street: data.address?.street,
            number: data.address?.number,
            complement: data.address?.complement,
            neighborhood: data.address?.neighborhood,
            city: data.address?.city,
            state: data.address?.state,
            country: data.address?.country,
            zipCode: data.address?.zipCode,
            reference: data.address?.reference,
          },
        })

        const employee = await prisma.employee.create({
          data: {
            workspaceId: workspace.id,
            userId: user.id,
            addressId: address.id,
            name,
            avatarUrl: data.avatarUrl,
            corporateEmail: data.corporateEmail,
            phone: data.phone,
            whatsapp: data.whatsapp,
            crmv: data.crmv,
          },
        })

        // TODO: Send email to user with login credentials

        return reply.status(201).send({
          employeeId: employee.id,
        })
      },
    )
}
