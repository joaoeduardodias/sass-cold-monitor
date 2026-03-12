import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

function generateStopPassword() {
  return randomBytes(12).toString('base64url')
}

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
            stopPassword: z.string(),
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

      const stopPassword = generateStopPassword()

      await prisma.collectorDevice.updateMany({
        where: {
          organizationId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      })

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

      await prisma.collectorDevice.create({
        data: {
          organizationId,
          userId,
          token: setupToken,
          stopPassword,
          isActive: true,
        },
      })

      return reply.status(200).send({ setupToken, stopPassword })
    },
  )

  app.withTypeProvider<ZodTypeProvider>().register(auth).get(
    '/devices/auth/latest',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Get latest collector token and stop password.',
        operationId: 'devicesAuthLatest',
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          organizationId: z.uuid(),
        }),
        response: {
          200: z.object({
            latest: z.object({
              token: z.string(),
              stopPassword: z.string(),
              createdAt: z.date(),
            }).nullable(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { organizationId } = request.query
      const userId = await request.getCurrentUserId()

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

      const latest = await prisma.collectorDevice.findFirst({
        where: {
          organizationId,
          isActive: true,
          stopPassword: {
            not: null,
          },
        },
        select: {
          token: true,
          stopPassword: true,
          createdAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      })

      if (!latest?.stopPassword) {
        return reply.status(200).send({ latest: null })
      }

      return reply.status(200).send({
        latest: {
          token: latest.token,
          stopPassword: latest.stopPassword,
          createdAt: latest.createdAt,
        },
      })
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
            stopPassword: z.string(),
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

      const collectorDevice = await prisma.collectorDevice.findFirst({
        where: {
          token: setupToken,
          organizationId,
          userId,
          isActive: true,
        },
        select: {
          id: true,
          stopPassword: true,
        },
      })

      if (!collectorDevice?.stopPassword) {
        return reply.status(401).send({ message: 'Invalid setup token' })
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

      await prisma.collectorDevice.update({
        where: {
          id: collectorDevice.id,
        },
        data: {
          token: wsToken,
          stopPassword: collectorDevice.stopPassword,
          isActive: true,
        },
      })

      return reply.status(200).send({
        token: wsToken,
        organizationId,
        stopPassword: collectorDevice.stopPassword,
      })
    },
  )
}
