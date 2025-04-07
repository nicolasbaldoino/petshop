import { SystemType } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

export async function requestPasswordRecover(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/password/recover',
    {
      schema: {
        tags: ['[ERP] Auth'],
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

      const userFromEmail = await prisma.user.findFirst({
        where: {
          workspaceId: workspace?.id || null,
          email,
          systemType: SystemType.ERP,
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
