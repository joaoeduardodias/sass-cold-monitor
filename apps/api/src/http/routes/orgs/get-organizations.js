"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizations = getOrganizations;
const auth_1 = require("@cold-monitor/auth");
const v4_1 = require("zod/v4");
const auth_2 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
async function getOrganizations(app) {
    app
        .withTypeProvider()
        .register(auth_2.auth)
        .get('/organizations', {
        schema: {
            tags: ['Organization'],
            summary: 'Get organization where user is member.',
            security: [{ bearerAuth: [] }],
            response: {
                200: v4_1.z.object({
                    organizations: v4_1.z.array(v4_1.z.object({
                        id: v4_1.z.uuid(),
                        name: v4_1.z.string(),
                        slug: v4_1.z.string(),
                        avatarUrl: v4_1.z.url().nullable(),
                        role: auth_1.roleSchema,
                    })),
                }),
            },
        },
    }, async (request) => {
        const userId = await request.getCurrentUserId();
        const organizations = await prisma_1.prisma.organization.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                avatarUrl: true,
                members: {
                    select: {
                        role: true,
                    },
                    where: {
                        userId,
                    },
                },
            },
            where: {
                members: {
                    some: {
                        userId,
                    },
                },
            },
        });
        const organizationsWithUserRole = organizations.map(({ members, ...org }) => {
            return {
                ...org,
                role: members[0].role,
            };
        });
        return { organizations: organizationsWithUserRole };
    });
}
