import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { env } from '@cold-monitor/env'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { sendEmailWithValidation } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import PasswordRecoveryEmail from '@/mail/templates/password-recovery-email'

export async function requestPasswordRecover(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/password/recover',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Password Recover.',
        operationId: 'requestPasswordRecover',
        body: z.object({
          email: z.email(),
        }),
        response: {
          201: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body
      const userFromEmail = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (!userFromEmail) {
        return reply.status(201).send()
      }

      const { id: code } = await prisma.token.create({
        data: {
          type: 'PASSWORD_RECOVER',
          userId: userFromEmail.id,
        },
      })

      const sendResult = await sendEmailWithValidation({
        from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_EMAIL}>`,
        to: [userFromEmail.email],
        subject: "Recuperação de senha",
        react: PasswordRecoveryEmail({ code, recipientName: userFromEmail.name }),
      }, 'requestPasswordRecover')

      if (!sendResult.success) {
        throw new BadRequestError(sendResult.message)
      }

      return reply.status(201).send()
    },
  )
}
