"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInstrument = createInstrument;
const client_1 = require("@prisma/client");
const v4_1 = require("zod/v4");
const auth_1 = require("@/http/middlewares/auth");
const unauthorized_error_1 = require("@/http/routes/_errors/unauthorized-error");
const prisma_1 = require("@/lib/prisma");
const create_slug_1 = require("@/utils/create-slug");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
async function createInstrument(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .post('/organizations/:slug/instrument', {
        schema: {
            tags: ['Instrument'],
            summary: 'Create a new instrument',
            security: [{ bearerAuth: [] }],
            body: v4_1.z.object({
                name: v4_1.z.string(),
                model: v4_1.z.number(),
                maxValue: v4_1.z.number(),
                minValue: v4_1.z.number(),
                isActive: v4_1.z.boolean().nullable(),
                type: v4_1.z.enum(client_1.InstrumentType),
                idSitrad: v4_1.z.number().nullable(),
            }),
            params: v4_1.z.object({
                slug: v4_1.z.string(),
            }),
            response: {
                201: v4_1.z.object({
                    instrumentId: v4_1.z.uuid(),
                }),
            },
        },
    }, async (request, reply) => {
        const { slug } = request.params;
        const userId = await request.getCurrentUserId();
        const { organization, membership } = await request.getUserMembership(slug);
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        if (cannot('create', 'Instrument')) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to create new instrument.`);
        }
        const { name, idSitrad, isActive, maxValue, minValue, model, type } = request.body;
        const instrument = await prisma_1.prisma.instrument.create({
            data: {
                name,
                slug: (0, create_slug_1.createSlug)(name),
                idSitrad,
                organizationId: organization.id,
                isActive: isActive ?? true,
                maxValue,
                minValue,
                model,
                type,
            },
        });
        return reply.status(201).send({
            instrumentId: instrument.id,
        });
    });
}
