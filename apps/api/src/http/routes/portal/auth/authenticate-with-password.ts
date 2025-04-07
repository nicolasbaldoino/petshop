import { SystemType } from '@prisma/client'
import { compare } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'

export async function authenticateWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/sessions/password',
    {
      schema: {
        tags: ['[Portal] Auth'],
        summary: 'Authenticate with email & password',
        body: z.object({
          slug: z.string(),
          email: z.string().email(),
          password: z.string(),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { slug, email, password } = request.body

      const workspace = await prisma.workspace.findUnique({
        where: {
          slug,
        },
      })

      if (!workspace) {
        throw new BadRequestError('Invalid credentials.')
      }

      const userFromEmail = await prisma.user.findUnique({
        where: {
          workspaceId_email_systemType: {
            workspaceId: workspace.id,
            email,
            systemType: SystemType.PORTAL,
          },
        },
      })

      if (!userFromEmail) {
        throw new BadRequestError('Invalid credentials.')
      }

      if (userFromEmail.passwordHash === null) {
        throw new BadRequestError(
          'User does not have a password, use social login.',
        )
      }

      const isPasswordValid = await compare(
        password,
        userFromEmail.passwordHash,
      )

      if (!isPasswordValid) {
        throw new BadRequestError('Invalid credentials.')
      }

      const token = await reply.jwtSign(
        {
          sub: userFromEmail.id,
        },
        {
          sign: {
            expiresIn: '7d',
          },
        },
      )

      return reply.status(201).send({ token })
    },
  )
}
