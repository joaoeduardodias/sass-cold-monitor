import { roleSchema } from '@cold-monitor/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { sendEmailWithValidation } from '@/lib/email'
import InviteEmail from '@/mail/templates/invite-email'
import { env } from '@cold-monitor/env'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function createInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/invites',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Create a new invite.',
          operationId: 'createInvite',
          security: [{ bearerAuth: [] }],
          body: z.object({
            email: z.email(),
            role: roleSchema,
          }),
          params: z.object({
            slug: z.string(),
          }),
          response: {
            201: z.object({
              inviteId: z.uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('create', 'Invite')) {
          throw new UnauthorizedError(
            `You're not allowed to create new invites.`,
          )
        }

        const { email, role } = request.body
        const [, domain] = email.split('@')

        if (
          organization.shouldAttachUsersByDomain &&
          organization.domain === domain
        ) {
          throw new BadRequestError(
            `Users with "${domain}" domain will join your organization automatically on login.`,
          )
        }
        const inviteWithSameEmail = await prisma.invite.findUnique({
          where: {
            email_organizationId: {
              email,
              organizationId: organization.id,
            },
          },
        })
        if (inviteWithSameEmail) {
          throw new BadRequestError(
            'Another invite with same e-mail already exists.',
          )
        }
        const memberWithSameEmail = await prisma.member.findFirst({
          where: {
            organizationId: organization.id,
            user: {
              email,
            },
          },
        })

        if (memberWithSameEmail) {
          throw new BadRequestError(
            'A member with this e-mail already belongs to your organization.',
          )
        }

        const invite = await prisma.invite.create({
          data: {
            organizationId: organization.id,
            email,
            role,
            authorId: userId,
          },
        })

        // mail send invite 
        const sendResult = await sendEmailWithValidation({
          from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_EMAIL}>`,
          to: [invite.email],
          subject: "Convite para ingressar na organização",
          react: InviteEmail({
            recipientName: invite.email.split('@')[0],
            invitedByName: organization.name,
            invitedByEmail: env.EMAIL_FROM_EMAIL,
            inviteLink: `${env.NEXT_PUBLIC_API_URL}/invite/${invite.id}`,
          }),
        }, 'createInvite');

        if (!sendResult.success) {
          throw new BadRequestError(sendResult.message)
        }

        return reply.status(201).send({
          inviteId: invite.id,
        })
      },
    )
}
