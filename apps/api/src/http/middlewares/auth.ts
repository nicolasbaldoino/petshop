import type { FastifyInstance } from 'fastify'
import { fastifyPlugin } from 'fastify-plugin'

import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request) => {
    request.getAuthenticatedUserId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()

        return sub
      } catch {
        throw new UnauthorizedError('Invalid token')
      }
    }

    request.getCurrentUser = async (slug: string) => {
      const userId = await request.getAuthenticatedUserId()

      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          workspace: {
            slug,
          },
        },
        include: {
          workspace: true,
        },
      })

      if (!user) {
        throw new UnauthorizedError('User not found')
      }

      if (!user.workspace) {
        throw new UnauthorizedError('Workspace not found')
      }

      const { workspace, ...userWithoutWorkspace } = user

      return {
        workspace,
        user: userWithoutWorkspace,
      }
    }
  })
})
