import 'fastify';

import type { Customer, Employee, User, Workspace } from '@prisma/client';

declare module 'fastify' {
  export interface FastifyRequest {
    getCurrentUserId(): Promise<string>
    getCurrentUser(slug: string): Promise<{ workspace: Workspace; user: User }>

    getCurrentEmployeeId(): Promise<string>
    getCurrentEmployee(
      slug: string,
    ): Promise<{ workspace: Workspace; employee: Employee }>

    getCurrentCustomerId(): Promise<string>
    getCurrentCustomer(
      slug: string,
    ): Promise<{ workspace: Workspace; customer: Customer }>
  }
}
