import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { prisma } from '@/lib/prisma'

const devicesAuthBootstrapBodySchema = z.object({
  organizationId: z.uuid(),
})

const devicesAuthLoginBodySchema = z.object({
  setupToken: z.string().min(1),
})

export async function devicesAuthLoginRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/devices/auth/bootstrap',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Generate setup token for collector app.',
        operationId: 'devicesAuthBootstrap',
        body: devicesAuthBootstrapBodySchema,
        response: {
          200: z.object({
            setupToken: z.string(),
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
      const { organizationId } = request.body
      const authorization = request.headers.authorization

      if (!authorization?.startsWith('Bearer ')) {
        return reply.status(401).send({ message: 'Missing auth token' })
      }

      const userToken = authorization.slice('Bearer '.length).trim()

      let userId: string
      try {
        const decoded = request.server.jwt.verify<{ sub: string }>(userToken)
        userId = decoded.sub
      } catch {
        return reply.status(401).send({ message: 'Invalid auth token' })
      }

      const organizationRows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM organizations
        WHERE id = ${organizationId}
        LIMIT 1
      `

      if (!organizationRows[0]) {
        return reply.status(400).send({ message: 'Invalid organization' })
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
        return reply.status(403).send({
          message: 'User cannot access this organization',
        })
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
        body: devicesAuthLoginBodySchema,
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

      const organizationRows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM organizations
        WHERE id = ${organizationId}
        LIMIT 1
      `

      if (!organizationRows[0]) {
        return reply.status(400).send({ message: 'Invalid organization' })
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
        return reply.status(403).send({
          message: 'User cannot access this organization',
        })
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
