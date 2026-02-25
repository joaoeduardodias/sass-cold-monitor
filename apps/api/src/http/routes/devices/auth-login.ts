import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'


export async function devicesAuthLoginRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).post(
    '/devices/auth/bootstrap',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Generate setup token for collector app.',
        operationId: 'devicesAuthBootstrap',
        security: [{ bearerAuth: [] }],
        body: z.object({
          organizationId: z.uuid(),
        }),
        response: {
          200: z.object({
            setupToken: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { organizationId } = request.body
      const userId = await request.getCurrentUserId()

      const organization = await prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
      })

      if (!organization) {
        throw new BadRequestError("Invalid organization")
      }

      const membership = await prisma.member.findFirst({
        where: {
          userId,
          organizationId,
          isActive: true,
        },
        select: {
          id: true,
        },
      })

      if (!membership) {
        throw new UnauthorizedError("User cannot access this organization")
      }

      const setupToken = await reply.jwtSign(
        {
          sub: userId,
          organizationId,
          scope: 'collector_setup',
        },
        {
          sign: {
            expiresIn: '10m',
          },
        },
      )

      return reply.status(200).send({ setupToken })
    },
  )

  app.withTypeProvider<ZodTypeProvider>().post(
    '/devices/auth/login',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Authenticate a collector device.',
        operationId: 'devicesAuthLogin',
        body: z.object({
          setupToken: z.string().min(1),
        }),
        response: {
          200: z.object({
            token: z.string(),
            organizationId: z.uuid(),
          }),
          400: z.object({
            message: z.string(),
          }),
          401: z.object({
            message: z.string(),
          }),
          403: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { setupToken } = request.body

      let organizationId: string
      let userId: string
      try {
        const decoded = request.server.jwt.verify<{
          sub: string
          organizationId?: string
          scope?: string
        }>(setupToken)

        if (decoded.scope !== 'collector_setup' || !decoded.organizationId) {
          return reply.status(401).send({ message: 'Invalid setup token' })
        }

        userId = decoded.sub
        organizationId = decoded.organizationId

      } catch {
        return reply.status(401).send({ message: 'Invalid setup token' })
      }

      const organization = await prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
      })

      if (!organization) {
        throw new BadRequestError("Invalid organization")
      }

      const membership = await prisma.member.findFirst({
        where: {
          userId,
          organizationId,
          isActive: true,
        },
        select: {
          id: true,
        },
      })

      if (!membership) {
        throw new UnauthorizedError("User cannot access this organization")
      }

      const wsToken = await reply.jwtSign(
        {
          sub: userId,
          organizationId,
        },
        {
          sign: {
            expiresIn: '30d',
          },
        },
      )

      return reply.status(200).send({
        token: wsToken,
        organizationId,
      })
    },
  )
}
