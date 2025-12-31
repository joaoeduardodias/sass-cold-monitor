"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMembers = getMembers;
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const auth_2 = require("@cold-monitor/auth");
const v4_1 = require("zod/v4");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function getMembers(app) {
    app.withTypeProvider().register(auth_1.auth).get('/organizations/:slug/members', {
        schema: {
            tags: ['Members'],
            summary: 'Get all  organization members.',
            security: [
                { bearerAuth: [] }
            ],
            params: v4_1.z.object({
                slug: v4_1.z.string()
            }),
            response: {
                200: v4_1.z.object({
                    members: v4_1.z.array(v4_1.z.object({
                        id: v4_1.z.uuid(),
                        userId: v4_1.z.uuid(),
                        role: auth_2.roleSchema,
                        name: v4_1.z.string().nullable(),
                        email: v4_1.z.email(),
                        avatarUrl: v4_1.z.url().nullable(),
                    }))
                })
            }
        }
    }, async (request, reply) => {
        const { slug } = request.params;
        const userId = await request.getCurrentUserId();
        const { membership, organization } = await request.getUserMembership(slug);
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        if (cannot('get', 'User')) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to see organization members.`);
        }
        const members = await prisma_1.prisma.member.findMany({
            select: {
                id: true,
                role: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    }
                }
            },
            where: {
                organizationId: organization.id
            },
            orderBy: {
                role: 'asc'
            }
        });
        const membersWithRoles = members.map(({ user: { id: userId, ...user }, ...member }) => {
            return {
                ...user,
                ...member,
                userId
            };
        });
        return reply.status(201).send({ members: membersWithRoles });
    });
}
