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
        tags: ['[SaaS] Auth'],
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

      const userWithSameEmail = await prisma.user.findFirst({
        where: {
          workspaceId: workspace?.id || null,
          email,
          systemType: SystemType.SAAS,
        },
      })

      if (userWithSameEmail) {
        throw new BadRequestError('User with same email already exists.')
      }

      const passwordHash = await hash(password, 6)

      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          systemType: SystemType.SAAS,
        },
      })

      return reply.status(201).send()
    },
  )
}
