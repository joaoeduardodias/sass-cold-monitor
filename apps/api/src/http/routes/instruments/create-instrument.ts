import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { InstrumentType } from '@/prisma/generated/enums'
import { createSlug } from '@/utils/create-slug'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function createInstrument(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/instrument',
      {
        schema: {
          tags: ['Instrument'],
          summary: 'Create a new instrument',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            model: z.number(),
            maxValue: z.number(),
            minValue: z.number(),
            isActive: z.boolean().nullable(),
            type: z.enum(InstrumentType),
            idSitrad: z.number().nullable(),
          }),
          params: z.object({
            slug: z.string(),
          }),
          response: {
            201: z.object({
              instrumentId: z.uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('create', 'Instrument')) {
          throw new UnauthorizedError(
            `You're not allowed to create new instrument.`,
          )
        }

        const { name, idSitrad, isActive, maxValue, minValue, model, type } =
          request.body

        const instrument = await prisma.instrument.create({
          data: {
            name,
            slug: createSlug(name),
            idSitrad,
            organizationId: organization.id,
            isActive: isActive ?? true,
            maxValue,
            minValue,
            model,
            type,
          },
        })

        return reply.status(201).send({
          instrumentId: instrument.id,
        })
      },
    )
}
