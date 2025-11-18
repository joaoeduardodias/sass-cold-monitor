import { instrumentSchema } from '@cold-monitor/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function deleteJoinInstrument(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:orgSlug/joinInstruments/:joinInstrumentId',
      {
        schema: {
          tags: ['joinInstruments'],
          summary: 'Delete a join instrument',
          security: [{ bearerAuth: [] }],
          params: z.object({
            orgSlug: z.string(),
            joinInstrumentId: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { joinInstrumentId, orgSlug } = request.params

        const userId = await request.getCurrentUserId()
        const { membership } = await request.getUserMembership(orgSlug)

        const joinInstrument = await prisma.joinInstrument.findUnique({
          where: {
            id: joinInstrumentId,
          },
          select: {
            firstInstrument: {
              select: {
                id: true,
                name: true,
              },
            },
            secondInstrument: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        if (!joinInstrument) {
          throw new BadRequestError('join instruments not found.')
        }

        const { cannot } = getUserPermissions(userId, membership.role)
        const authFirstInstrument = instrumentSchema.parse(
          joinInstrument.firstInstrument,
        )
        const authSecondInstrument = instrumentSchema.parse(
          joinInstrument.secondInstrument,
        )
        if (
          cannot('delete', authFirstInstrument) &&
          cannot('delete', authSecondInstrument)
        ) {
          throw new UnauthorizedError(
            `You're not allowed to delete this join instruments.`,
          )
        }

        await prisma.joinInstrument.delete({
          where: {
            id: joinInstrumentId,
          },
        })

        return reply.status(204).send()
      },
    )
}
