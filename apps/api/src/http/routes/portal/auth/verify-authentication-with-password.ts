import { SystemType } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'

export async function verifyAuthenticationWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/sessions/password/verify',
    {
      schema: {
        tags: ['[Portal] Auth'],
        summary: 'Verify authentication with email & password',
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
          systemType: SystemType.PORTAL,
        },
      })

      if (!userFromEmail || userFromEmail?.emailVerified) {
        return reply.status(201).send()
      }

      await prisma.token.deleteMany({
        where: {
          type: 'EMAIL_VERIFICATION',
          userId: userFromEmail.id,
        },
      })

      const { id: code } = await prisma.token.create({
        data: {
          type: 'EMAIL_VERIFICATION',
          userId: userFromEmail.id,
        },
      })

      // Send email with verification code

      console.log('Verification code:', code)

      return reply.status(201).send()
    },
  )
}
