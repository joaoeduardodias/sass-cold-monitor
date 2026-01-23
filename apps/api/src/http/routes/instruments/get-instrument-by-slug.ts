import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { InstrumentType } from '@/prisma/generated/enums'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getInstrumentBySlug(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:orgSlug/instruments/:instrumentSlug',
      {
        schema: {
          tags: ['Instruments'],
          summary: 'Get instrument by slug.',
          security: [{ bearerAuth: [] }],
          params: z.object({
            orgSlug: z.string(),
            instrumentSlug: z.string(),
          }),
          response: {
            200: z.object({
              instrument: z.object({
                id: z.uuid(),
                name: z.string(),
                slug: z.string(),
                model: z.number(),
                orderDisplay: z.number(),
                maxValue: z.number(),
                minValue: z.number(),
                isActive: z.boolean(),
                type: z.enum(InstrumentType),
                idSitrad: z.number().nullable(),
              }),
            }),
          },
        },
      },
      async (request) => {
        const { instrumentSlug, orgSlug } = request.params

        const userId = await request.getCurrentUserId()
        const { organization, membership } =
          await request.getUserMembership(orgSlug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', 'Instrument')) {
          throw new UnauthorizedError(
            `You're not allowed to see this instrument.`,
          )
        }

        const instrument = await prisma.instrument.findUnique({
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            model: true,
            maxValue: true,
            minValue: true,
            isActive: true,
            idSitrad: true,
            orderDisplay: true,
          },
          where: {
            organizationId: organization.id,
            id: instrumentSlug,
          },
        })

        if (!instrument) {
          throw new BadRequestError('Instrument not found.')
        }

        return { instrument }
      },
    )
}
