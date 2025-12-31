"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInstrument = updateInstrument;
const auth_1 = require("@cold-monitor/auth");
const client_1 = require("@prisma/client");
const v4_1 = require("zod/v4");
const auth_2 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const bad_request_error_1 = require("../_errors/bad-request-error");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function updateInstrument(app) {
    app
        .withTypeProvider()
        .register(auth_2.auth)
        .put('/organizations/:orgSlug/instruments', {
        schema: {
            tags: ['Instruments'],
            summary: 'Update instruments.',
            security: [{ bearerAuth: [] }],
            body: v4_1.z.object({
                instruments: v4_1.z.array(v4_1.z.object({
                    id: v4_1.z.uuid(),
                    name: v4_1.z.string(),
                    model: v4_1.z.number(),
                    orderDisplay: v4_1.z.number(),
                    maxValue: v4_1.z.number(),
                    minValue: v4_1.z.number(),
                    isActive: v4_1.z.boolean(),
                    type: v4_1.z.enum(client_1.InstrumentType),
                    idSitrad: v4_1.z.number().nullable(),
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
        const { instruments } = request.body;
        await prisma_1.prisma.$transaction(async (tx) => {
            await Promise.all(instruments.map(async (instrument) => {
                const authInstrument = auth_1.instrumentSchema.parse(instrument);
                if (cannot('update', authInstrument)) {
                    throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to update this instrument.`);
                }
                const result = await tx.instrument.updateMany({
                    where: { id: instrument.id },
                    data: instrument,
                });
                if (result.count === 0) {
                    throw new bad_request_error_1.BadRequestError(`Instrument not found.`);
                }
            }));
        });
        return reply.status(204).send();
    });
}
