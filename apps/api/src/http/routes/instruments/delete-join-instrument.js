"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJoinInstrument = deleteJoinInstrument;
const auth_1 = require("@cold-monitor/auth");
const v4_1 = require("zod/v4");
const auth_2 = require("@/http/middlewares/auth");
const bad_request_error_1 = require("@/http/routes/_errors/bad-request-error");
const unauthorized_error_1 = require("@/http/routes/_errors/unauthorized-error");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
async function deleteJoinInstrument(app) {
    app
        .withTypeProvider()
        .register(auth_2.auth)
        .delete('/organizations/:orgSlug/joinInstruments/:joinInstrumentId', {
        schema: {
            tags: ['joinInstruments'],
            summary: 'Delete a join instrument',
            security: [{ bearerAuth: [] }],
            params: v4_1.z.object({
                orgSlug: v4_1.z.string(),
                joinInstrumentId: v4_1.z.string(),
            }),
            response: {
                204: v4_1.z.null(),
            },
        },
    }, async (request, reply) => {
        const { joinInstrumentId, orgSlug } = request.params;
        const userId = await request.getCurrentUserId();
        const { membership } = await request.getUserMembership(orgSlug);
        const joinInstrument = await prisma_1.prisma.joinInstrument.findUnique({
            where: {
                id: joinInstrumentId,
            },
            select: {
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
        });
        if (!joinInstrument) {
            throw new bad_request_error_1.BadRequestError('join instruments not found.');
        }
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        const authFirstInstrument = auth_1.instrumentSchema.parse(joinInstrument.firstInstrument);
        const authSecondInstrument = auth_1.instrumentSchema.parse(joinInstrument.secondInstrument);
        if (cannot('delete', authFirstInstrument) &&
            cannot('delete', authSecondInstrument)) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to delete this join instruments.`);
        }
        await prisma_1.prisma.joinInstrument.delete({
            where: {
                id: joinInstrumentId,
            },
        });
        return reply.status(204).send();
    });
}
