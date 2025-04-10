import { SystemType } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../../_errors/bad-request-error'

export async function verifyAuthenticationWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/sessions/password/verify',
    {
      schema: {
        tags: ['[ERP] Auth'],
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

      if (!workspace) {
        throw new BadRequestError('Workspace not found.')
      }

      const userFromEmail = await prisma.user.findUnique({
        where: {
          workspaceId_email_systemType: {
            workspaceId: workspace.id,
            email,
            systemType: SystemType.ERP,
          },
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
