"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeInvite = revokeInvite;
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const v4_1 = require("zod/v4");
const bad_request_error_1 = require("../_errors/bad-request-error");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function revokeInvite(app) {
    app.withTypeProvider().register(auth_1.auth).post('/organizations/:slug/invites/:inviteId', {
        schema: {
            tags: ['Invites'],
            summary: 'Revoke an invite.',
            security: [
                { bearerAuth: [] }
            ],
            params: v4_1.z.object({
                slug: v4_1.z.string(),
                inviteId: v4_1.z.url()
            }),
            response: {
                204: v4_1.z.null()
            }
        }
    }, async (request, reply) => {
        const { slug, inviteId } = request.params;
        const userId = await request.getCurrentUserId();
        const { membership, organization } = await request.getUserMembership(slug);
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        if (cannot('delete', 'Invite')) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to delete an invite.`);
        }
        const invite = await prisma_1.prisma.invite.findUnique({
            where: {
                id: inviteId
            }
        });
        if (invite) {
            throw new bad_request_error_1.BadRequestError('Invite not found.');
        }
        await prisma_1.prisma.invite.delete({
            where: {
                id: inviteId,
                organizationId: organization.id
            }
        });
        return reply.status(204).send();
    });
}
