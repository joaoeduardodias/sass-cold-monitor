"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferOrganization = transferOrganization;
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const auth_2 = require("@cold-monitor/auth");
const v4_1 = require("zod/v4");
const bad_request_error_1 = require("../_errors/bad-request-error");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function transferOrganization(app) {
    app.withTypeProvider().register(auth_1.auth).patch('/organizations/:slug/owner', {
        schema: {
            tags: ['Organization'],
            summary: 'Transfer organization ownership.',
            security: [
                { bearerAuth: [] }
            ],
            body: v4_1.z.object({
                transferToUserId: v4_1.z.uuid(),
            }),
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
        if (cannot('transfer_ownership', authOrganization)) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to transfer this organization ownership.`);
        }
        const { transferToUserId } = request.body;
        const transferToMembership = await prisma_1.prisma.member.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: organization.id,
                    userId: transferToUserId
                }
            }
        });
        if (!transferToMembership) {
            throw new bad_request_error_1.BadRequestError('Target user is not a member of this organization.');
        }
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.member.update({
                where: {
                    organizationId_userId: {
                        organizationId: organization.id,
                        userId: transferToUserId
                    }
                },
                data: {
                    role: 'ADMIN'
                }
            }),
            prisma_1.prisma.organization.update({
                where: {
                    id: organization.id
                },
                data: {
                    ownerId: transferToUserId
                }
            })
        ]);
        return reply.status(204).send();
    });
}
