import 'fastify'

import type { User, Workspace } from '@prisma/client'

declare module 'fastify' {
  export interface FastifyRequest {
    getAuthenticatedUserId(): Promise<string>

    getCurrentUser(slug: string): Promise<{ workspace: Workspace; user: User }>
  }
}
