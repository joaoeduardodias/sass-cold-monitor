import { instrumentSchema } from '@cold-monitor/auth'
import { InstrumentType } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function updateInstrument(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:orgSlug/instrument/:instrumentSlug',
      {
        schema: {
          tags: ['Instruments'],
          summary: 'Update a instrument.',
          security: [{ bearerAuth: [] }],
          body: z.object({
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
          params: z.object({
            orgSlug: z.string(),
            instrumentSlug: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { instrumentSlug, orgSlug } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } =
          await request.getUserMembership(orgSlug)

        const instrument = await prisma.instrument.findUnique({
          where: {
            slug: instrumentSlug,
            organizationId: organization.id,
          },
        })

        if (!instrument) {
          throw new BadRequestError('Instrument not found.')
        }

        const { cannot } = getUserPermissions(userId, membership.role)
        const authInstrument = instrumentSchema.parse(instrument)

        if (cannot('update', authInstrument)) {
          throw new UnauthorizedError(
            `You're not allowed to update this instrument.`,
          )
        }

        const {
          name,
          idSitrad,
          isActive,
          maxValue,
          minValue,
          model,
          orderDisplay,
          slug,
          type,
        } = request.body

        await prisma.instrument.update({
          where: {
            slug: instrumentSlug,
          },
          data: {
            name,
            idSitrad,
            isActive,
            maxValue,
            minValue,
            model,
            orderDisplay,
            slug,
            type,
          },
        })

        return reply.status(204).send()
      },
    )
}
