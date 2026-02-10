import { instrumentSchema } from '@cold-monitor/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { InstrumentType } from '@/prisma/generated/enums'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function updateInstrument(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:orgSlug/instruments',
      {
        schema: {
          tags: ['Instruments'],
          summary: 'Update instruments.',
          operationId: 'updateInstruments',
          security: [{ bearerAuth: [] }],
          body: z.object({
            instruments: z.array(
              z.object({
                id: z.uuid(),
                name: z.string(),
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
          params: z.object({
            orgSlug: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { orgSlug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } = await request.getUserMembership(orgSlug)
        const { cannot } = getUserPermissions(userId, membership.role)

        const { instruments } = request.body


        await prisma.$transaction(async (tx) => {
          await Promise.all(
            instruments.map(async (instrument) => {
              const authInstrument = instrumentSchema.parse({
                __typename: 'Instrument',
                id: instrument.id,
                organization_id: organization.id,
              })

              if (cannot('update', authInstrument)) {
                throw new UnauthorizedError(
                  `You're not allowed to update this instrument.`,
                )
              }
              const result = await tx.instrument.updateMany({
                where: { id: instrument.id },
                data: instrument,
              })

              if (result.count === 0) {
                throw new BadRequestError(`Instrument not found.`)
              }
            }),
          )
        })

        return reply.status(204).send()
      },
    )
}
