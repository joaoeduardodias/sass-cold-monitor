import { env } from '@cold-monitor/env'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { sendEmailWithValidation } from '@/lib/email'
import { prisma } from '@/lib/prisma'

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  isAlertTypeEnabled,
} from './_defaults'

const alertTypeSchema = z.enum(['critical', 'warning'])

export async function sendEmailAlert(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/alerts/email',
      {
        schema: {
          tags: ['Notifications'],
          summary:
            'Send an e-mail alert. It only sends when e-mail notifications are enabled.',
          operationId: 'sendEmailAlert',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            alertType: alertTypeSchema,
            chamberName: z.string().trim().min(1),
            currentValue: z.string().trim().min(1),
            limitValue: z.string().trim().min(1),
            timestamp: z.string().trim().optional(),
            subject: z.string().trim().optional(),
          }),
          response: {
            200: z.object({
              sent: z.boolean(),
              reason: z.string().optional(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const { organization } = await request.getUserMembership(slug)

        const dbSettings = await prisma.notificationSettings.findUnique({
          where: {
            organizationId: organization.id,
          },
        })

        const settings = dbSettings
          ? {
            emailEnabled: dbSettings.emailEnabled,
            emailRecipients: dbSettings.emailRecipients,
            criticalAlerts: dbSettings.criticalAlerts,
            warningAlerts: dbSettings.warningAlerts,
            emailTemplate: dbSettings.emailTemplate,
          }
          : DEFAULT_NOTIFICATION_SETTINGS

        if (!settings.emailEnabled) {
          return reply.status(200).send({
            sent: false,
            reason: 'email_notifications_disabled',
          })
        }
        if (settings.emailRecipients.length === 0) {
          return reply.status(200).send({
            sent: false,
            reason: 'no_recipients_configured',
          })
        }

        const { alertType } = request.body
        if (!isAlertTypeEnabled(alertType, settings)) {
          return reply.status(200).send({
            sent: false,
            reason: 'alert_type_disabled',
          })
        }

        const { chamberName, currentValue, limitValue, timestamp, subject } =
          request.body

        const text = settings.emailTemplate
          .replaceAll('{chamber_name}', chamberName)
          .replaceAll('{alert_type}', alertType)
          .replaceAll('{current_value}', currentValue)
          .replaceAll('{limit_value}', limitValue)
          .replaceAll(
            '{timestamp}',
            timestamp ?? new Date().toISOString(),
          )

        const fallbackSubject = `Alerta ${alertType.toUpperCase()} - ${chamberName}`

        const sendResult = await sendEmailWithValidation({
          from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_EMAIL}>`,
          to: settings.emailRecipients,
          subject: subject || fallbackSubject,
          text,
        }, 'sendEmailAlert')

        if (!sendResult.success) {
          throw new BadRequestError(sendResult.message)
        }

        return reply.status(200).send({
          sent: true,
        })
      },
    )
}
