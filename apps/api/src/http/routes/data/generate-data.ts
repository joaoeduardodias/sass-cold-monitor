import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import {
  generateInstrumentData,
  saveInstrumentData,
} from '@/utils/generate-data'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function generateData(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:orgSlug/instruments/:instrumentId/generateData',
      {
        schema: {
          tags: ['Instruments'],
          summary: 'Generate instrument data.',
          operationId: 'generateData',
          security: [{ bearerAuth: [] }],
          params: z.object({
            orgSlug: z.string(),
            instrumentId: z.uuid(),
          }),
          body: z.object({
            startDate: z.date('Data inicial inválida'),
            defrostDate: z.date('Data de descongelamento inválida'),
            endDate: z.date('Data final inválida'),
            variation: z.number(),
            initialTemp: z.number().nullish(),
            averageTemp: z.number().nullish(),
          }),
          response: {
            201: z.object({
              generatedData: z.array(
                z.object({
                  instrumentId: z.uuid(),
                  createdAt: z.date(),
                  data: z.number(),
                  editData: z.number(),
                  generateData: z.number(),
                  userEditData: z.string().nullable(),
                }),
              ),
            }),
          },
        },
      },

      async (request, reply) => {
        const { orgSlug, instrumentId } = request.params
        const userId = await request.getCurrentUserId()
        const { membership } = await request.getUserMembership(orgSlug)
        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('create', 'InstrumentData')) {
          throw new UnauthorizedError(
            `You're not allowed generate this instrument data.`,
          )
        }

        const {
          endDate,
          startDate,
          variation,
          defrostDate,
          averageTemp,
          initialTemp,
        } = request.body
        const instrument = await prisma.instrument.findUnique({
          where: {
            id: instrumentId,
          },
          select: {
            id: true,
            type: true,
          },
        })

        if (!instrument) {
          throw new BadRequestError('Instrument not found.')
        }
        if (startDate >= endDate) {
          throw new BadRequestError(
            'Data inicial deve ser menor que a data final.',
          )
        }

        const generatedData = generateInstrumentData({
          instrumentId,
          type: instrument.type,
          startDate,
          endDate,
          defrostDate,
          variation,
          initialTemp: initialTemp ?? undefined,
          averageTemp: averageTemp ?? undefined,
        })

        await saveInstrumentData(generatedData)

        return reply.status(201).send({ generatedData })
      },
    )
}
