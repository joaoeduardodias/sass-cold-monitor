"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvite = createInvite;
const auth_1 = require("@cold-monitor/auth");
const v4_1 = require("zod/v4");
const auth_2 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const bad_request_error_1 = require("../_errors/bad-request-error");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function createInvite(app) {
    app
        .withTypeProvider()
        .register(auth_2.auth)
        .post('/organizations/:slug/invites', {
        schema: {
            tags: ['Invites'],
            summary: 'Create a new invite.',
            security: [{ bearerAuth: [] }],
            body: v4_1.z.object({
                email: v4_1.z.email(),
                role: auth_1.roleSchema,
            }),
            params: v4_1.z.object({
                slug: v4_1.z.string(),
            }),
            response: {
                201: v4_1.z.object({
                    inviteId: v4_1.z.uuid(),
                }),
            },
        },
    }, async (request, reply) => {
        const { slug } = request.params;
        const userId = await request.getCurrentUserId();
        const { membership, organization } = await request.getUserMembership(slug);
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        if (cannot('create', 'Invite')) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to create new invites.`);
        }
        const { email, role } = request.body;
        const [, domain] = email.split('@');
        if (organization.shouldAttachUsersByDomain &&
            organization.domain === domain) {
            throw new bad_request_error_1.BadRequestError(`Users with "${domain}" domain will join your organization automatically on login.`);
        }
        const inviteWithSameEmail = await prisma_1.prisma.invite.findUnique({
            where: {
                email_organizationId: {
                    email,
                    organizationId: organization.id,
                },
            },
        });
        if (inviteWithSameEmail) {
            throw new bad_request_error_1.BadRequestError('Another invite with same e-mail already exists.');
        }
        const memberWithSameEmail = await prisma_1.prisma.member.findFirst({
            where: {
                organizationId: organization.id,
                user: {
                    email,
                },
            },
        });
        if (memberWithSameEmail) {
            throw new bad_request_error_1.BadRequestError('A member with this e-mail already belongs to your organization.');
        }
        const invite = await prisma_1.prisma.invite.create({
            data: {
                organizationId: organization.id,
                email,
                role,
                authorId: userId,
            },
        });
        return reply.status(201).send({
            inviteId: invite.id,
        });
    });
}
