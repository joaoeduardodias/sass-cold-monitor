"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateData = updateData;
const v4_1 = require("zod/v4");
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const bad_request_error_1 = require("../_errors/bad-request-error");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function updateData(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .put('/organizations/:orgSlug/instrument/data', {
        schema: {
            tags: ['Instruments'],
            summary: 'Update a instrument data.',
            security: [{ bearerAuth: [] }],
            body: v4_1.z.object({
                data: v4_1.z.array(v4_1.z.object({
                    id: v4_1.z.uuid(),
                    editData: v4_1.z.number(),
                    userUpdatedAt: v4_1.z.uuid(),
                })),
            }),
            params: v4_1.z.object({
                orgSlug: v4_1.z.string(),
            }),
            response: {
                204: v4_1.z.null(),
            },
        },
    }, async (request, reply) => {
        const { orgSlug } = request.params;
        const userId = await request.getCurrentUserId();
        const { membership } = await request.getUserMembership(orgSlug);
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        if (cannot('update', 'InstrumentData')) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to update this instrument data.`);
        }
        const { data } = request.body;
        await prisma_1.prisma.$transaction(async (tx) => {
            await Promise.all(data.map(async (item) => {
                const result = await tx.instrumentData.updateMany({
                    where: { id: item.id },
                    data: item,
                });
                if (result.count === 0) {
                    throw new bad_request_error_1.BadRequestError(`Instrument data not found: ${item.id}`);
                }
            }));
        });
        return reply.status(204).send();
    });
}
