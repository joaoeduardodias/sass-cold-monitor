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
      '/organizations/:slug/joinInstrument',
      {
        schema: {
          tags: ['Instruments'],
          summary: 'Update join instruments.',
          security: [{ bearerAuth: [] }],
          body: z.object({
            joinInstruments: z.array(
              z.object({
                id: z.uuid(),
                name: z.string(),
                isActive: z.boolean(),
                firstInstrumentId: z.uuid(),
                secondInstrumentId: z.uuid(),
              }),
            ),
          }),
          params: z.object({
            slug: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership } = await request.getUserMembership(slug)
        const { cannot } = getUserPermissions(userId, membership.role)

        const { joinInstruments } = request.body

        await prisma.$transaction(async (tx) => {
          await Promise.all(
            joinInstruments.map(async (joinInstrument) => {
              if (cannot('update', 'Instrument')) {
                throw new UnauthorizedError(
                  `You're not allowed to update this join instrument.`,
                )
              }
              const result = await tx.joinInstrument.updateMany({
                where: { id: joinInstrument.id },
                data: joinInstrument,
              })

              if (result.count === 0) {
                throw new BadRequestError(`Join instrument not found.`)
              }
            }),
          )
        })

        return reply.status(204).send()
      },
    )
}
