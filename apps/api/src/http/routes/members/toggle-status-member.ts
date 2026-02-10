import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function toggleStatusMember(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/organizations/:slug/members/:memberId/status',
      {
        schema: {
          tags: ['Members'],
          summary: 'Toggle an member status.',
          operationId: 'toggleStatusMember',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            memberId: z.uuid(),
          }),
          body: z.object({
            status: z.enum(['active', 'inactive']),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug, memberId } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('update', 'User')) {
          throw new UnauthorizedError(
            `You're not allowed to update status of this member.`,
          )
        }
        const { status } = request.body

        await prisma.member.update({
          where: {
            id: memberId,
            organizationId: organization.id,
          },
          data: {
            isActive: status === 'active' ? true : false,
          },
        })

        return reply.status(204).send()
      },
    )
}
