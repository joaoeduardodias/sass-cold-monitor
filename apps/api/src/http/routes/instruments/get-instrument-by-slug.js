"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstrumentBySlug = getInstrumentBySlug;
const client_1 = require("@prisma/client");
const v4_1 = require("zod/v4");
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const bad_request_error_1 = require("../_errors/bad-request-error");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function getInstrumentBySlug(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .get('/organizations/:orgSlug/instruments/:instrumentSlug', {
        schema: {
            tags: ['Instruments'],
            summary: 'Get instrument by slug.',
            security: [{ bearerAuth: [] }],
            params: v4_1.z.object({
                orgSlug: v4_1.z.string(),
                instrumentSlug: v4_1.z.string(),
            }),
            response: {
                200: v4_1.z.object({
                    instrument: v4_1.z.object({
                        id: v4_1.z.uuid(),
                        name: v4_1.z.string(),
                        slug: v4_1.z.string(),
                        model: v4_1.z.number(),
                        orderDisplay: v4_1.z.number(),
                        maxValue: v4_1.z.number(),
                        minValue: v4_1.z.number(),
                        isActive: v4_1.z.boolean(),
                        type: v4_1.z.enum(client_1.InstrumentType),
                        idSitrad: v4_1.z.number().nullable(),
                    }),
                }),
            },
        },
    }, async (request) => {
        const { instrumentSlug, orgSlug } = request.params;
        const userId = await request.getCurrentUserId();
        const { organization, membership } = await request.getUserMembership(orgSlug);
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        if (cannot('get', 'Instrument')) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to see this instrument.`);
        }
        const instrument = await prisma_1.prisma.instrument.findUnique({
            select: {
                id: true,
                name: true,
                slug: true,
                type: true,
                model: true,
                maxValue: true,
                minValue: true,
                isActive: true,
                idSitrad: true,
                orderDisplay: true,
            },
            where: {
                organizationId: organization.id,
                id: instrumentSlug,
            },
        });
        if (!instrument) {
            throw new bad_request_error_1.BadRequestError('Instrument not found.');
        }
        return { instrument };
    });
}
