import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function updateData(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:orgSlug/instrument/data',
      {
        schema: {
          tags: ['Instruments'],
          summary: 'Update a instrument data.',
          operationId: 'updateData',
          security: [{ bearerAuth: [] }],
          body: z.object({
            data: z.array(
              z.object({
                id: z.uuid(),
                editData: z.number(),
                userUpdatedAt: z.uuid(),
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
        const { membership } = await request.getUserMembership(orgSlug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('update', 'InstrumentData')) {
          throw new UnauthorizedError(
            `You're not allowed to update this instrument data.`,
          )
        }

        const { data } = request.body

        await prisma.$transaction(async (tx) => {
          await Promise.all(
            data.map(async (item) => {
              const result = await tx.instrumentData.updateMany({
                where: { id: item.id },
                data: item,
              })

              if (result.count === 0) {
                throw new BadRequestError(
                  `Instrument data not found: ${item.id}`,
                )
              }
            }),
          )
        })

        return reply.status(204).send()
      },
    )
}
