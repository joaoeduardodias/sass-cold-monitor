import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

import { DEFAULT_NOTIFICATION_SETTINGS } from './_defaults'

export async function getNotificationSettings(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/notification-settings',
      {
        schema: {
          tags: ['Notifications'],
          summary: 'Get organization notification settings.',
          operationId: 'getNotificationSettings',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              settings: z.object({
                emailEnabled: z.boolean(),
                emailRecipients: z.array(z.email()),
                pushEnabled: z.boolean(),
                criticalAlerts: z.boolean(),
                warningAlerts: z.boolean(),
                emailTemplate: z.string(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const { organization } = await request.getUserMembership(slug)

        const settings = await prisma.notificationSettings.findUnique({
          where: {
            organizationId: organization.id,
          },
        })

        return reply.status(200).send({
          settings: settings
            ? {
              emailEnabled: settings.emailEnabled,
              emailRecipients: settings.emailRecipients,
              pushEnabled: settings.pushEnabled,
              criticalAlerts: settings.criticalAlerts,
              warningAlerts: settings.warningAlerts,
              emailTemplate: settings.emailTemplate,
            }
            : DEFAULT_NOTIFICATION_SETTINGS,
        })
      },
    )
}
