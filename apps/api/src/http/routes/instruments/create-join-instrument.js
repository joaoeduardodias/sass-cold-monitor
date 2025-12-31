"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJoinInstrument = createJoinInstrument;
const v4_1 = require("zod/v4");
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const bad_request_error_1 = require("../_errors/bad-request-error");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function createJoinInstrument(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .post('/organizations/:slug/joinInstrument', {
        schema: {
            tags: ['Instruments'],
            summary: 'Create join instruments.',
            security: [{ bearerAuth: [] }],
            body: v4_1.z.object({
                name: v4_1.z.string(),
                firstInstrumentId: v4_1.z.uuid(),
                secondInstrumentId: v4_1.z.uuid(),
            }),
            params: v4_1.z.object({
                slug: v4_1.z.string(),
            }),
            response: {
                201: v4_1.z.object({
                    joinInstrumentId: v4_1.z.uuid(),
                }),
            },
        },
    }, async (request, reply) => {
        const { slug } = request.params;
        const { firstInstrumentId, secondInstrumentId, name } = request.body;
        const userId = await request.getCurrentUserId();
        const { organization, membership } = await request.getUserMembership(slug);
        const instruments = await prisma_1.prisma.instrument.findMany({
            where: {
                id: {
                    in: [firstInstrumentId, secondInstrumentId],
                },
                organizationId: organization.id,
            },
        });
        if (!instruments) {
            throw new bad_request_error_1.BadRequestError('Instruments not found this organization.');
        }
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        if (cannot('create', 'Instrument')) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to create join instruments.`);
        }
        const joinInstrument = await prisma_1.prisma.joinInstrument.create({
            data: {
                name,
                firstInstrumentId,
                secondInstrumentId,
            },
        });
        return reply.status(201).send({ joinInstrumentId: joinInstrument.id });
    });
}
