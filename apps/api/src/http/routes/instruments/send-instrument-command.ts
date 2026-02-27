import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { agentConnectionByOrg } from '@/realtime/agent-connections'
import { getUserPermissions } from '@/utils/get-user-permissions'

const instrumentCommandBodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('SET_DEFROST'),
    value: z.boolean(),
  }),
  z.object({
    action: z.literal('SET_FAN'),
    value: z.boolean(),
  }),
  z.object({
    action: z.literal('SET_SETPOINT'),
    value: z.number(),
  }),
  z.object({
    action: z.literal('SET_DIFFERENTIAL'),
    value: z.number(),
  }),
])

export async function sendInstrumentCommand(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:orgSlug/instruments/:instrumentId/command',
      {
        schema: {
          tags: ['Instruments'],
          summary: 'Send command to instrument collector.',
          operationId: 'sendInstrumentCommand',
          security: [{ bearerAuth: [] }],
          params: z.object({
            orgSlug: z.string(),
            instrumentId: z.uuid(),
          }),
          body: instrumentCommandBodySchema,
          response: {
            202: z.object({
              status: z.literal('queued'),
              command: z.object({
                instrumentId: z.uuid(),
                idSitrad: z.number().nullable(),
                modelId: z.number(),
                action: z.enum([
                  'SET_DEFROST',
                  'SET_FAN',
                  'SET_SETPOINT',
                  'SET_DIFFERENTIAL',
                ]),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const { orgSlug, instrumentId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(orgSlug)
        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('update', 'Instrument')) {
          throw new UnauthorizedError(`You're not allowed to update instruments.`)
        }

        const instrument = await prisma.instrument.findUnique({
          where: { id: instrumentId },
          select: {
            id: true,
            idSitrad: true,
            model: true,
            organizationId: true,
          },
        })

        if (!instrument || instrument.organizationId !== organization.id) {
          throw new BadRequestError('Instrument not found.')
        }

        const agentConnection = agentConnectionByOrg.get(organization.id)

        if (!agentConnection || agentConnection.readyState !== agentConnection.OPEN) {
          throw new BadRequestError('No active collector agent for this organization')
        }

        agentConnection.send(
          JSON.stringify({
            type: 'INSTRUMENT_COMMAND',
            payload: {
              instrumentId: instrument.id,
              idSitrad: instrument.idSitrad ?? null,
              modelId: instrument.model,
              action: request.body.action,
              value: request.body.value,
              timestamp: new Date().toISOString(),
            },
          }),
        )

        return reply.status(202).send({
          status: 'queued',
          command: {
            instrumentId: instrument.id,
            idSitrad: instrument.idSitrad ?? null,
            modelId: instrument.model,
            action: request.body.action,
          },
        })
      },
    )
}
