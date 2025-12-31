"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMember = removeMember;
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const v4_1 = require("zod/v4");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function removeMember(app) {
    app.withTypeProvider().register(auth_1.auth).delete('/organizations/:slug/members/:memberId', {
        schema: {
            tags: ['Members'],
            summary: 'Remove a member from the organization.',
            security: [
                { bearerAuth: [] }
            ],
            params: v4_1.z.object({
                slug: v4_1.z.string(),
                memberId: v4_1.z.uuid()
            }),
            response: {
                204: v4_1.z.null()
            }
        }
    }, async (request, reply) => {
        const { slug, memberId } = request.params;
        const userId = await request.getCurrentUserId();
        const { membership, organization } = await request.getUserMembership(slug);
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        if (cannot('delete', 'User')) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to remove this member from the organization.`);
        }
        await prisma_1.prisma.member.delete({
            where: {
                id: memberId,
                organizationId: organization.id
            }
        });
        return reply.status(204).send();
    });
}
