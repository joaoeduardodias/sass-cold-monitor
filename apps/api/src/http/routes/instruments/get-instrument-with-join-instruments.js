"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstrumentsWithJoinInstruments = getInstrumentsWithJoinInstruments;
const v4_1 = require("zod/v4");
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function getInstrumentsWithJoinInstruments(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .get('/organization/:orgSlug/instrumentsWithJoinInstruments', {
        schema: {
            tags: ['Instruments'],
            summary: 'Get instruments and join instruments of organization.',
            security: [{ bearerAuth: [] }],
            params: v4_1.z.object({
                orgSlug: v4_1.z.string(),
            }),
            response: {
                200: v4_1.z.object({
                    instrumentsWithJoinInstruments: v4_1.z.array(v4_1.z.object({
                        id: v4_1.z.uuid(),
                        name: v4_1.z.string(),
                    })),
                }),
            },
        },
    }, async (request) => {
        const { orgSlug } = request.params;
        const userId = await request.getCurrentUserId();
        const { organization, membership } = await request.getUserMembership(orgSlug);
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        if (cannot('get', 'Instrument')) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to see this instruments.`);
        }
        const instruments = await prisma_1.prisma.instrument.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                orderDisplay: 'asc',
            },
            where: {
                isActive: true,
                organizationId: organization.id,
            },
        });
        const joinInstruments = await prisma_1.prisma.joinInstrument.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc',
            },
            where: {
                isActive: true,
                firstInstrument: {
                    organizationId: organization.id,
                },
                secondInstrument: {
                    organizationId: organization.id,
                },
            },
        });
        const instrumentsWithJoinInstruments = [
            ...instruments,
            ...joinInstruments,
        ];
        return { instrumentsWithJoinInstruments };
    });
}
