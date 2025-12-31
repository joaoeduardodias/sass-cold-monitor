"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInstrument = updateInstrument;
const v4_1 = require("zod/v4");
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const bad_request_error_1 = require("../_errors/bad-request-error");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function updateInstrument(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .put('/organizations/:slug/joinInstrument', {
        schema: {
            tags: ['Instruments'],
            summary: 'Update join instruments.',
            security: [{ bearerAuth: [] }],
            body: v4_1.z.object({
                joinInstruments: v4_1.z.array(v4_1.z.object({
                    id: v4_1.z.uuid(),
                    name: v4_1.z.string(),
                    isActive: v4_1.z.boolean(),
                    firstInstrumentId: v4_1.z.uuid(),
                    secondInstrumentId: v4_1.z.uuid(),
                })),
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
        const { membership } = await request.getUserMembership(slug);
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        const { joinInstruments } = request.body;
        await prisma_1.prisma.$transaction(async (tx) => {
            await Promise.all(joinInstruments.map(async (joinInstrument) => {
                if (cannot('update', 'Instrument')) {
                    throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to update this join instrument.`);
                }
                const result = await tx.joinInstrument.updateMany({
                    where: { id: joinInstrument.id },
                    data: joinInstrument,
                });
                if (result.count === 0) {
                    throw new bad_request_error_1.BadRequestError(`Join instrument not found.`);
                }
            }));
        });
        return reply.status(204).send();
    });
}
