import { SystemType } from '@prisma/client'
import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/register',
    {
      schema: {
        tags: ['[Portal] Auth'],
        summary: 'Create a new account',
        body: z.object({
          slug: z.string(),
          name: z.string(),
          email: z.string().email(),
          password: z.string().min(6),
        }),
      },
    },
    async (request, reply) => {
      const { slug, name, email, password } = request.body

      const workspace = await prisma.workspace.findUnique({
        where: {
          slug,
        },
      })

      if (!workspace) {
        throw new BadRequestError('Workspace not found.')
      }

      const userWithSameEmail = await prisma.user.findUnique({
        where: {
          workspaceId_email_systemType: {
            workspaceId: workspace.id,
            email,
            systemType: SystemType.PORTAL,
          },
        },
      })

      if (userWithSameEmail) {
        throw new BadRequestError('User with same email already exists.')
      }

      const passwordHash = await hash(password, 6)

      const user = await prisma.user.create({
        data: {
          workspaceId: workspace.id,
          email,
          passwordHash,
          systemType: SystemType.PORTAL,
        },
      })

      await prisma.customer.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          name,
        },
      })

      return reply.status(201).send()
    },
  )
}
