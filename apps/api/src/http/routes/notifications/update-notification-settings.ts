import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'

import { DEFAULT_EMAIL_TEMPLATE } from './_defaults'

export async function updateNotificationSettings(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug/notification-settings',
      {
        schema: {
          tags: ['Notifications'],
          summary: 'Update organization notification settings.',
          operationId: 'updateNotificationSettings',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            emailEnabled: z.boolean(),
            emailRecipients: z.array(z.email()),
            pushEnabled: z.boolean(),
            criticalAlerts: z.boolean(),
            warningAlerts: z.boolean(),
            emailTemplate: z.string().trim().min(1),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const { membership, organization } = await request.getUserMembership(slug)

        if (membership.role !== 'ADMIN' && membership.role !== 'EDITOR') {
          throw new UnauthorizedError(`You're not allowed to update notification settings.`)
        }

        const {
          emailEnabled,
          emailRecipients,
          pushEnabled,
          criticalAlerts,
          warningAlerts,
          emailTemplate,
        } = request.body

        await prisma.notificationSettings.upsert({
          where: {
            organizationId: organization.id,
          },
          create: {
            organizationId: organization.id,
            emailEnabled,
            emailRecipients,
            pushEnabled,
            criticalAlerts,
            warningAlerts,
            emailTemplate: emailTemplate || DEFAULT_EMAIL_TEMPLATE,
          },
          update: {
            emailEnabled,
            emailRecipients,
            pushEnabled,
            criticalAlerts,
            warningAlerts,
            emailTemplate: emailTemplate || DEFAULT_EMAIL_TEMPLATE,
          },
        })

        return reply.status(204).send()
      },
    )
}
