import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { sendEmailWithValidation } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import WelcomeEmail from '@/mail/templates/welcome-email'
import { createSlug } from '@/utils/create-slug'
import { env } from '@cold-monitor/env'

import { BadRequestError } from '../_errors/bad-request-error'

export async function createOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organization',
      {
        schema: {
          tags: ['Organization'],
          summary: 'Create a new organization.',
          operationId: 'createOrganization',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            domain: z.string().nullish(),
            shouldAttachUsersByDomain: z.boolean().optional(),
          }),
          response: {
            201: z.object({
              organizationId: z.uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { name, domain, shouldAttachUsersByDomain } = request.body
        const user = await prisma.user.findUnique({
          select: {
            email: true,
            name: true,
          },
          where: {
            id: userId,
          },
        })

        if (!user) {
          throw new BadRequestError('User not found.')
        }

        if (domain) {
          const organizationByDomain = await prisma.organization.findUnique({
            where: { domain },
          })
          if (organizationByDomain) {
            throw new BadRequestError(
              'Another organization with same domain already exists.',
            )
          }
        }
        const organization = await prisma.organization.create({
          data: {
            name,
            slug: createSlug(name),
            domain,
            shouldAttachUsersByDomain,
            ownerId: userId,
            members: {
              create: {
                userId,
                role: 'ADMIN',
              },
            },
          },
        })

        const sendResult = await sendEmailWithValidation({
          from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_EMAIL}>`,
          to: [user.email],
          subject: `Empresa criada com sucesso: ${organization.name}`,
          react: WelcomeEmail({
            userName: user.name,
            organizationName: organization.name,
            organizationSlug: organization.slug,
          }),
        }, 'createOrganization')

        if (!sendResult.success) {
          console.error(sendResult.message)
        }

        return reply.status(201).send({
          organizationId: organization.id,
        })
      },
    )
}
