import { instrumentSchema } from '@cold-monitor/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function deleteInstrument(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:orgSlug/instruments/:instrumentSlug',
      {
        schema: {
          tags: ['Instruments'],
          summary: 'Delete a instrument',
          security: [{ bearerAuth: [] }],
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

        if (cannot('delete', authInstrument)) {
          throw new UnauthorizedError(
            `You're not allowed to delete this instrument.`,
          )
        }

        await prisma.instrument.delete({
          where: {
            slug: instrumentSlug,
          },
        })

        return reply.status(204).send()
      },
    )
}
