import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function createJoinInstrument(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/joinInstrument',
      {
        schema: {
          tags: ['Instruments'],
          summary: 'Create join instruments.',
          operationId: 'createJoinInstrument',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            firstInstrumentId: z.uuid(),
            secondInstrumentId: z.uuid(),
          }),
          params: z.object({
            slug: z.string(),
          }),
          response: {
            201: z.object({
              joinInstrumentId: z.uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const { firstInstrumentId, secondInstrumentId, name } = request.body
        const userId = await request.getCurrentUserId()
        const { organization, membership } =
          await request.getUserMembership(slug)
        const instruments = await prisma.instrument.findMany({
          where: {
            id: {
              in: [firstInstrumentId, secondInstrumentId],
            },
            organizationId: organization.id,
          },
        })

        if (!instruments) {
          throw new BadRequestError('Instruments not found this organization.')
        }

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('create', 'Instrument')) {
          throw new UnauthorizedError(
            `You're not allowed to create join instruments.`,
          )
        }

        const joinInstrument = await prisma.joinInstrument.create({
          data: {
            name,
            firstInstrumentId,
            secondInstrumentId,
          },
        })

        return reply.status(201).send({ joinInstrumentId: joinInstrument.id })
      },
    )
}
