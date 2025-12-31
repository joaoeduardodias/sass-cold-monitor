"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMember = updateMember;
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const auth_2 = require("@cold-monitor/auth");
const v4_1 = require("zod/v4");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function updateMember(app) {
    app.withTypeProvider().register(auth_1.auth).put('/organizations/:slug/members/:memberId', {
        schema: {
            tags: ['Members'],
            summary: 'Update an member.',
            security: [
                { bearerAuth: [] }
            ],
            params: v4_1.z.object({
                slug: v4_1.z.string(),
                memberId: v4_1.z.uuid()
            }),
            body: v4_1.z.object({
                role: auth_2.roleSchema
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
        if (cannot('update', 'User')) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to update this member.`);
        }
        const { role } = request.body;
        await prisma_1.prisma.member.update({
            where: {
                id: memberId,
                organizationId: organization.id
            },
            data: {
                role,
            }
        });
        return reply.status(204).send();
    });
}
