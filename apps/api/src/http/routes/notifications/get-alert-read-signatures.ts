import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

type AlertReadSignatureRow = {
  instrumentId: string
  signature: string
  readAt: Date
}

export async function getAlertReadSignatures(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/alerts/read-signatures',
      {
        schema: {
          tags: ['Notifications'],
          summary: 'Get latest read alert signatures for current user.',
          operationId: 'getAlertReadSignatures',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              readSignatures: z.array(
                z.object({
                  instrumentId: z.uuid(),
                  signature: z.string().min(1),
                  readAt: z.date(),
                }),
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { organization } = await request.getUserMembership(slug)

        const readSignatures = await prisma.$queryRaw<AlertReadSignatureRow[]>`
          SELECT DISTINCT ON (arl.instrument_id)
            arl.instrument_id AS "instrumentId",
            arl.alert_signature AS "signature",
            arl.created_at AS "readAt"
          FROM alert_read_logs arl
          WHERE arl.organization_id = ${organization.id}
            AND arl.user_id = ${userId}
          ORDER BY arl.instrument_id, arl.created_at DESC
        `

        return reply.status(200).send({ readSignatures })
      },
    )
}
