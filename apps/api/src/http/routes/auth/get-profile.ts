import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { roleSchema } from '@cold-monitor/auth'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

const permissionsByRole: Record<z.infer<typeof roleSchema>, string[]> = {
  ADMIN: ['Gerenciar sistema', 'Gerenciar organização', 'Gerenciar usuários'],
  EDITOR: ['Criar dados', 'Editar dados', 'Visualizar dados'],
  OPERATOR: ['Operar leituras', 'Editar dados'],
  VIEWER: ['Visualizar dados'],
}

export async function getProfile(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/profile',
      {
        schema: {
          tags: ['Auth'],
          summary: 'Get authenticated user profile.',
          operationId: 'getProfile',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              user: z.object({
                id: z.uuid(),
                name: z.string(),
                email: z.email(),
                avatarUrl: z.url().nullable(),
                createdAt: z.date(),
                updatedAt: z.date(),
                memberships: z.array(
                  z.object({
                    id: z.uuid(),
                    role: roleSchema,
                    isActive: z.boolean(),
                    joinedAt: z.date(),
                    organization: z.object({
                      id: z.uuid(),
                      name: z.string(),
                      slug: z.string(),
                    }),
                  }),
                ),
                permissions: z.array(z.string()),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const user = await prisma.user.findUnique({
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
            member_on: {
              select: {
                id: true,
                role: true,
                isActive: true,
                createdAt: true,
                organization: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          where: {
            id: userId,
          },
        })
        if (!user) {
          throw new Error('User not found.')
        }

        const permissions = Array.from(
          new Set(
            user.member_on.flatMap((membership) =>
              permissionsByRole[membership.role] ?? [],
            ),
          ),
        )

        return reply.send({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            memberships: user.member_on.map((membership) => ({
              id: membership.id,
              role: membership.role,
              isActive: membership.isActive,
              joinedAt: membership.createdAt,
              organization: membership.organization,
            })),
            permissions,
          },
        })
      },
    )
}
