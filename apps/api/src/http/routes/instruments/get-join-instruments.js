"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJoinInstruments = getJoinInstruments;
const v4_1 = require("zod/v4");
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function getJoinInstruments(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .get('/organization/:orgSlug/joinInstruments', {
        schema: {
            tags: ['Instruments'],
            summary: 'Get join instruments of organization.',
            security: [{ bearerAuth: [] }],
            params: v4_1.z.object({
                orgSlug: v4_1.z.string(),
            }),
            response: {
                200: v4_1.z.object({
                    joinInstruments: v4_1.z.array(v4_1.z.object({
                        name: v4_1.z.string(),
                        id: v4_1.z.string(),
                        isActive: v4_1.z.boolean(),
                        firstInstrument: v4_1.z.object({
                            name: v4_1.z.string(),
                            id: v4_1.z.string(),
                        }),
                        secondInstrument: v4_1.z.object({
                            name: v4_1.z.string(),
                            id: v4_1.z.string(),
                        }),
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
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to see this join instruments.`);
        }
        const joinInstruments = await prisma_1.prisma.joinInstrument.findMany({
            select: {
                id: true,
                name: true,
                isActive: true,
                firstInstrument: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                secondInstrument: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            where: {
                firstInstrument: {
                    organization: {
                        slug: orgSlug,
                    },
                },
                secondInstrument: {
                    organization: {
                        slug: orgSlug,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });
        return { joinInstruments };
    });
}
