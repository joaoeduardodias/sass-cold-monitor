"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstruments = getInstruments;
const client_1 = require("@prisma/client");
const v4_1 = require("zod/v4");
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function getInstruments(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .get('/organization/:orgSlug/instruments', {
        schema: {
            tags: ['Instruments'],
            summary: 'Get instruments of organization.',
            security: [{ bearerAuth: [] }],
            params: v4_1.z.object({
                orgSlug: v4_1.z.string(),
            }),
            response: {
                200: v4_1.z.object({
                    instruments: v4_1.z.array(v4_1.z.object({
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
                    })),
                }),
            },
        },
    }, async (request) => {
        const { orgSlug } = request.params;
        const userId = await request.getCurrentUserId();
        const { membership } = await request.getUserMembership(orgSlug);
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        if (cannot('get', 'Instrument')) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to see this instruments.`);
        }
        const instruments = await prisma_1.prisma.instrument.findMany({
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
                organization: {
                    slug: orgSlug,
                },
            },
            orderBy: {
                orderDisplay: 'asc',
            },
        });
        return { instruments };
    });
}
