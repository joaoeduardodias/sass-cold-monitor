"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInstrument = deleteInstrument;
const auth_1 = require("@cold-monitor/auth");
const v4_1 = require("zod/v4");
const auth_2 = require("@/http/middlewares/auth");
const bad_request_error_1 = require("@/http/routes/_errors/bad-request-error");
const unauthorized_error_1 = require("@/http/routes/_errors/unauthorized-error");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
async function deleteInstrument(app) {
    app
        .withTypeProvider()
        .register(auth_2.auth)
        .delete('/organizations/:orgSlug/instruments/:instrumentSlug', {
        schema: {
            tags: ['Instruments'],
            summary: 'Delete a instrument',
            security: [{ bearerAuth: [] }],
            params: v4_1.z.object({
                orgSlug: v4_1.z.string(),
                instrumentSlug: v4_1.z.string(),
            }),
            response: {
                204: v4_1.z.null(),
            },
        },
    }, async (request, reply) => {
        const { instrumentSlug, orgSlug } = request.params;
        const userId = await request.getCurrentUserId();
        const { organization, membership } = await request.getUserMembership(orgSlug);
        const instrument = await prisma_1.prisma.instrument.findUnique({
            where: {
                slug: instrumentSlug,
                organizationId: organization.id,
            },
        });
        if (!instrument) {
            throw new bad_request_error_1.BadRequestError('Instrument not found.');
        }
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        const authInstrument = auth_1.instrumentSchema.parse(instrument);
        if (cannot('delete', authInstrument)) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to delete this instrument.`);
        }
        await prisma_1.prisma.instrument.delete({
            where: {
                slug: instrumentSlug,
            },
        });
        return reply.status(204).send();
    });
}
