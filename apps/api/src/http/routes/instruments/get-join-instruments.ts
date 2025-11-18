import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getJoinInstruments(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organization/:orgSlug/joinInstruments',
      {
        schema: {
          tags: ['Instruments'],
          summary: 'Get join instruments of organization.',
          security: [{ bearerAuth: [] }],
          params: z.object({
            orgSlug: z.string(),
          }),
          response: {
            200: z.object({
              joinInstruments: z.array(
                z.object({
                  name: z.string(),
                  id: z.string(),
                  isActive: z.boolean(),
                  firstInstrument: z.object({
                    name: z.string(),
                    id: z.string(),
                  }),
                  secondInstrument: z.object({
                    name: z.string(),
                    id: z.string(),
                  }),
                }),
              ),
            }),
          },
        },
      },
      async (request) => {
        const { orgSlug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership } = await request.getUserMembership(orgSlug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', 'Instrument')) {
          throw new UnauthorizedError(
            `You're not allowed to see this join instruments.`,
          )
        }

        const joinInstruments = await prisma.joinInstrument.findMany({
          select: {
            id: true,
            name: true,
            isActive: true,
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
          where: {
            firstInstrument: {
              organization: {
                slug: orgSlug,
              },
            },
            secondInstrument: {
              organization: {
                slug: orgSlug,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        })

        return { joinInstruments }
      },
    )
}
