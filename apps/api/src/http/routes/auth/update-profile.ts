import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function updateProfile(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/profile',
      {
        schema: {
          tags: ['Auth'],
          summary: 'Update authenticated user profile.',
          operationId: 'updateProfile',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string().trim().min(2),
            email: z.email().trim(),
            avatarUrl: z.url().nullable(),
          }),
          response: {
            200: z.object({
              user: z.object({
                id: z.uuid(),
                name: z.string(),
                email: z.email(),
                avatarUrl: z.url().nullable(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { name, email, avatarUrl } = request.body

        const userWithSameEmail = await prisma.user.findFirst({
          where: {
            email,
            id: {
              not: userId,
            },
          },
          select: {
            id: true,
          },
        })

        if (userWithSameEmail) {
          throw new BadRequestError('E-mail already in use by another account.')
        }

        const user = await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            name,
            email,
            avatarUrl,
          },
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        })

        return reply.send({ user })
      },
    )
}
