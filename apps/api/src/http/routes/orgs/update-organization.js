"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrganization = updateOrganization;
const auth_1 = require("@cold-monitor/auth");
const v4_1 = require("zod/v4");
const auth_2 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const bad_request_error_1 = require("../_errors/bad-request-error");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function updateOrganization(app) {
    app
        .withTypeProvider()
        .register(auth_2.auth)
        .put('/organizations/:slug', {
        schema: {
            tags: ['Organization'],
            summary: 'Update organization details.',
            security: [{ bearerAuth: [] }],
            body: v4_1.z.object({
                name: v4_1.z.string(),
                domain: v4_1.z.string().nullish(),
                shouldAttachUsersByDomain: v4_1.z.boolean().optional(),
            }),
            params: v4_1.z.object({
                slug: v4_1.z.string(),
            }),
            response: {
                204: v4_1.z.null(),
            },
        },
    }, async (request, reply) => {
        const { slug } = request.params;
        const userId = await request.getCurrentUserId();
        const { organization, membership } = await request.getUserMembership(slug);
        const { name, domain, shouldAttachUsersByDomain } = request.body;
        const authOrganization = auth_1.organizationSchema.parse(organization);
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        if (cannot('update', authOrganization)) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to update this organization.`);
        }
        if (domain) {
            const organizationByDomain = await prisma_1.prisma.organization.findFirst({
                where: {
                    domain,
                    id: {
                        not: organization.id,
                    },
                },
            });
            if (organizationByDomain) {
                throw new bad_request_error_1.BadRequestError('Another organization with same domain already exists.');
            }
        }
        await prisma_1.prisma.organization.update({
            where: {
                id: organization.id,
            },
            data: {
                name,
                domain,
                shouldAttachUsersByDomain,
            },
        });
        return reply.status(204).send();
    });
}
