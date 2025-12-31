"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvites = getInvites;
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const auth_2 = require("@cold-monitor/auth");
const v4_1 = require("zod/v4");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function getInvites(app) {
    app.withTypeProvider().register(auth_1.auth).get('/organizations/:slug/invites', {
        schema: {
            tags: ['Invites'],
            summary: 'Get all organizations invites.',
            security: [{ bearerAuth: [] }],
            params: v4_1.z.object({
                slug: v4_1.z.string()
            }),
            response: {
                200: v4_1.z.object({
                    invites: v4_1.z.array(v4_1.z.object({
                        id: v4_1.z.uuid(),
                        email: v4_1.z.email(),
                        createdAt: v4_1.z.date(),
                        role: auth_2.roleSchema,
                        author: v4_1.z.object({
                            id: v4_1.z.uuid(),
                            name: v4_1.z.string().nullable(),
                        }).nullable(),
                    }))
                })
            },
        },
    }, async (request) => {
        const { slug } = request.params;
        const userId = await request.getCurrentUserId();
        const { membership, organization } = await request.getUserMembership(slug);
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        if (cannot('get', 'Invite')) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to get organization invites.`);
        }
        const invites = await prisma_1.prisma.invite.findMany({
            where: {
                organizationId: organization.id,
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return { invites };
    });
}
