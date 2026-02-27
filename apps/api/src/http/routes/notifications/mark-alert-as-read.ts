import { randomUUID } from 'node:crypto'

import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'

export async function markAlertAsRead(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/alerts/read',
      {
        schema: {
          tags: ['Notifications'],
          summary: 'Persist alert as read by the current user.',
          operationId: 'markAlertAsRead',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            instrumentId: z.uuid(),
            signature: z.string().trim().min(1),
            severity: z.enum(['warning', 'critical']),
            value: z.number().finite(),
            minThreshold: z.number().finite(),
            maxThreshold: z.number().finite(),
            thresholdType: z.enum(['min', 'max']),
            alertTimestamp: z.coerce.date(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { organization } = await request.getUserMembership(slug)

        const {
          instrumentId,
          signature,
          severity,
          value,
          minThreshold,
          maxThreshold,
          thresholdType,
          alertTimestamp,
        } = request.body

        const instrument = await prisma.instrument.findFirst({
          where: {
            id: instrumentId,
            organizationId: organization.id,
          },
          select: {
            id: true,
          },
        })

        if (!instrument) {
          throw new BadRequestError('Instrument does not belong to this organization.')
        }

        await prisma.$executeRaw`
          INSERT INTO alert_read_logs (
            id,
            organization_id,
            instrument_id,
            user_id,
            alert_signature,
            severity,
            value,
            min_threshold,
            max_threshold,
            threshold_type,
            alert_timestamp
          )
          VALUES (
            ${randomUUID()},
            ${organization.id},
            ${instrumentId},
            ${userId},
            ${signature},
            ${severity},
            ${value},
            ${minThreshold},
            ${maxThreshold},
            ${thresholdType},
            ${alertTimestamp}
          )
          ON CONFLICT (organization_id, user_id, instrument_id, alert_signature)
          DO NOTHING
        `

        return reply.status(204).send()
      },
    )
}
