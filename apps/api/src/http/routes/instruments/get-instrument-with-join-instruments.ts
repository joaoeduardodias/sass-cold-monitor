import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getInstrumentsWithJoinInstruments(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organization/:orgSlug/instrumentsWithJoinInstruments',
      {
        schema: {
          tags: ['Instruments'],
          summary: 'Get instruments and join instruments of organization.',
          operationId: 'getInstrumentsWithJoinInstruments',
          security: [{ bearerAuth: [] }],
          params: z.object({
            orgSlug: z.string(),
          }),
          response: {
            200: z.object({
              instrumentsWithJoinInstruments: z.array(
                z.object({
                  id: z.uuid(),
                  name: z.string(),
                }),
              ),
            }),
          },
        },
      },
      async (request) => {
        const { orgSlug } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } =
          await request.getUserMembership(orgSlug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', 'Instrument')) {
          throw new UnauthorizedError(
            `You're not allowed to see this instruments.`,
          )
        }

        const instruments = await prisma.instrument.findMany({
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            orderDisplay: 'asc',
          },
          where: {
            isActive: true,
            organizationId: organization.id,
          },
        })

        const joinInstruments = await prisma.joinInstrument.findMany({
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: 'asc',
          },
          where: {
            isActive: true,
            firstInstrument: {
              organizationId: organization.id,
            },
            secondInstrument: {
              organizationId: organization.id,
            },
          },
        })

        const instrumentsWithJoinInstruments = [
          ...instruments,
          ...joinInstruments,
        ]

        return { instrumentsWithJoinInstruments }
      },
    )
}
