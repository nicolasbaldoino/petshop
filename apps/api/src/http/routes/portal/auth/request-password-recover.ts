import { SystemType } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../../_errors/bad-request-error'

export async function requestPasswordRecover(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/password/recover',
    {
      schema: {
        tags: ['[Portal] Auth'],
        summary: 'Request password recover',
        body: z.object({
          slug: z.string(),
          email: z.string().email(),
        }),
        response: {
          201: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { slug, email } = request.body

      const workspace = await prisma.workspace.findUnique({
        where: {
          slug,
        },
      })

      if (!workspace) {
        throw new BadRequestError('Workspace not found.')
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
        // We don't want to people to know if the user really exists
        return reply.status(201).send()
      }

      await prisma.token.deleteMany({
        where: {
          type: 'PASSWORD_RECOVER',
          userId: userFromEmail.id,
        },
      })

      const { id: code } = await prisma.token.create({
        data: {
          type: 'PASSWORD_RECOVER',
          userId: userFromEmail.id,
        },
      })

      // Send email with password recover link

      console.log('Password recover token:', code)

      return reply.status(201).send()
    },
  )
}
