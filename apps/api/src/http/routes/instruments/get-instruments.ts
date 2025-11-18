import { InstrumentType } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getInstruments(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organization/:orgSlug/instruments',
      {
        schema: {
          tags: ['Instruments'],
          summary: 'Get instruments of organization.',
          security: [{ bearerAuth: [] }],
          params: z.object({
            orgSlug: z.string(),
          }),
          response: {
            200: z.object({
              instruments: z.array(
                z.object({
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
              ),
            }),
          },
        },
      },
      async (request) => {
        const { orgSlug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership } = await request.getUserMembership(orgSlug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', 'Instrument')) {
          throw new UnauthorizedError(
            `You're not allowed to see this instruments.`,
          )
        }

        const instruments = await prisma.instrument.findMany({
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
            organization: {
              slug: orgSlug,
            },
          },
          orderBy: {
            orderDisplay: 'asc',
          },
        })

        return { instruments }
      },
    )
}
