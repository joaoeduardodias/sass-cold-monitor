import { env } from '@cold-monitor/env'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { sendEmailWithValidation } from '@/lib/email'
import TestSendEmail from '@/mail/templates/test-send-email'

export async function testEmailNotification(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/notification-settings/test-email',
      {
        schema: {
          tags: ['Notifications'],
          summary: 'Send test notification e-mail.',
          operationId: 'testEmailNotification',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            recipients: z.array(z.email()).min(1),
          }),
          response: {
            200: z.object({
              sent: z.boolean(),
              messageId: z.string().optional(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const { membership, organization } = await request.getUserMembership(slug)

        if (membership.role !== 'ADMIN' && membership.role !== 'EDITOR') {
          throw new UnauthorizedError(`You're not allowed to test notification e-mail.`)
        }

        const { recipients } = request.body
        const sendResult = await sendEmailWithValidation({
          from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_EMAIL}>`,
          to: recipients,
          subject: `Teste de notificações - ${organization.name}`,
          react: TestSendEmail({
            organizationName: organization.name,
            sentAt: new Date().toISOString(),
          }),
        }, 'testEmailNotification')

        if (!sendResult.success) {
          throw new BadRequestError(sendResult.message)
        }

        return reply.status(200).send({
          sent: true,
          messageId: sendResult.id,
        })
      },
    )
}
