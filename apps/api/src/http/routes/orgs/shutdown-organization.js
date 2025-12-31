"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shutdownOrganization = shutdownOrganization;
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const auth_2 = require("@cold-monitor/auth");
const v4_1 = require("zod/v4");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function shutdownOrganization(app) {
    app.withTypeProvider().register(auth_1.auth).delete('/organizations/:slug', {
        schema: {
            tags: ['Organization'],
            summary: 'Shutdown organization.',
            security: [
                { bearerAuth: [] }
            ],
            params: v4_1.z.object({
                slug: v4_1.z.string()
            }),
            response: {
                204: v4_1.z.null()
            }
        }
    }, async (request, reply) => {
        const { slug } = request.params;
        const userId = await request.getCurrentUserId();
        const { organization, membership } = await request.getUserMembership(slug);
        const authOrganization = auth_2.organizationSchema.parse(organization);
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        if (cannot('delete', authOrganization)) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to shutdown this organization.`);
        }
        await prisma_1.prisma.organization.delete({
            where: {
                id: organization.id
            }
        });
        return reply.status(204).send();
    });
}
