import { instrumentSchema } from '@cold-monitor/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function updateDifferentialInstrument(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/organizations/:orgSlug/instruments/:instrumentId',
      {
        schema: {
          tags: ['Instruments'],
          summary: 'Update Differential instrument.',
          operationId: 'updateDifferentialInstrument',
          security: [{ bearerAuth: [] }],
          body: z.object({
            differential: z.number().min(0).max(1000),
          }),
          params: z.object({
            orgSlug: z.string(),
            instrumentId: z.uuid(),
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

        const { differential } = request.body
        const { instrumentId } = request.params

        const instrument = await prisma.instrument.findUnique({
          where: {
            id: instrumentId,
          },
          select: {
            idSitrad: true,
            id: true,
            name: true,
            model: true,
          },
        })

        if (!instrument) {
          throw new BadRequestError('Instrumento não encontrado.')
        }

        const authInstrument = instrumentSchema.parse(instrument)

        if (cannot('update', authInstrument)) {
          throw new UnauthorizedError(
            'Você não tem permissão para atualizar este instrumento.',
          )
        }
        //  CRIAR ESTRATÉGIA PARA ATUALIZAR O DIFERENCIAL NO SITRAD

        // await fetch(`https://api.sitrad.com.br/v1/instruments/${instrument.idSitrad}`, {
        //   method: 'PATCH',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     Authorization: `Bearer ${process.env.SITRAD_API_KEY}`,
        //   },
        //   body: JSON.stringify({
        //     differential,
        //   }),
        // })
        console.log(differential)

        return reply.status(204).send()
      },
    )
}
