import { DocumentType, Gender, SystemType } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'

export async function updateCustomer(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/workspaces/:slug/customers/:customerId',
      {
        schema: {
          tags: ['[ERP] Customers'],
          summary: 'Update a customer',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            email: z.string().email(),
            avatarUrl: z.string().url().nullish(),
            documentType: z.nativeEnum(DocumentType).nullish(),
            document: z.string().nullish(),
            rg: z.string().nullish(),
            tradeName: z.string().nullish(),
            corporateName: z.string().nullish(),
            stateRegistration: z.string().nullish(),
            marketingEmail: z.string().email().nullish(),
            billingEmail: z.string().email().nullish(),
            birthDate: z.string().nullish(),
            gender: z.nativeEnum(Gender).nullish(),
            phone: z.string().nullish(),
            whatsapp: z.string().nullish(),
            icmsContributor: z.boolean().nullish(),
            address: z
              .object({
                street: z.string().nullish(),
                number: z.string().nullish(),
                complement: z.string().nullish(),
                neighborhood: z.string().nullish(),
                city: z.string().nullish(),
                state: z.string().nullish(),
                country: z.string().nullish(),
                zipCode: z.string().nullish(),
                reference: z.string().nullish(),
              })
              .nullish(),
          }),
          params: z.object({
            slug: z.string(),
            customerId: z.string().uuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug, customerId } = request.params
        const { workspace } = await request.getCurrentUser(slug)

        const customer = await prisma.customer.findUnique({
          where: {
            id: customerId,
            workspaceId: workspace.id,
          },
          include: {
            user: true,
          },
        })

        if (!customer) {
          throw new BadRequestError('Customer not found.')
        }

        const { name, email, ...data } = request.body

        const userByEmail = await prisma.user.findFirst({
          where: {
            workspaceId: workspace.id,
            email,
            systemType: SystemType.PORTAL,
            id: {
              not: customer.userId,
            },
          },
        })

        if (userByEmail) {
          throw new UnauthorizedError('Email already exists.')
        }

        await prisma.user.update({
          where: {
            id: customer.userId,
          },
          data: {
            email,
          },
        })

        const address = await prisma.address.upsert({
          where: {
            id: customer.addressId || undefined,
          },
          create: {
            street: data.address?.street,
            number: data.address?.number,
            complement: data.address?.complement,
            neighborhood: data.address?.neighborhood,
            city: data.address?.city,
            state: data.address?.state,
            country: data.address?.country,
            zipCode: data.address?.zipCode,
            reference: data.address?.reference,
          },
          update: {
            street: data.address?.street,
            number: data.address?.number,
            complement: data.address?.complement,
            neighborhood: data.address?.neighborhood,
            city: data.address?.city,
            state: data.address?.state,
            country: data.address?.country,
            zipCode: data.address?.zipCode,
            reference: data.address?.reference,
          },
        })

        await prisma.customer.update({
          where: {
            id: customer.id,
          },
          data: {
            addressId: address.id,
            name,
            avatarUrl: data.avatarUrl,
            documentType: data.documentType,
            document: data.document,
            rg: data.rg,
            tradeName: data.tradeName,
            corporateName: data.corporateName,
            stateRegistration: data.stateRegistration,
            marketingEmail: data.marketingEmail,
            billingEmail: data.billingEmail,
            birthDate: data.birthDate ? new Date(data.birthDate) : null,
            gender: data.gender,
            phone: data.phone,
            whatsapp: data.whatsapp,
            icmsContributor: data.icmsContributor,
          },
        })

        if (customer.user?.email !== email) {
          // TODO: Send email to user with updated login credentials
        }

        return reply.status(204).send()
      },
    )
}
