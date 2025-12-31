"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateData = generateData;
const v4_1 = require("zod/v4");
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const generate_data_1 = require("@/utils/generate-data");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const bad_request_error_1 = require("../_errors/bad-request-error");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function generateData(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .post('/organizations/:orgSlug/instruments/:instrumentId/generateData', {
        schema: {
            tags: ['Instruments'],
            summary: 'Generate instrument data.',
            security: [{ bearerAuth: [] }],
            params: v4_1.z.object({
                orgSlug: v4_1.z.string(),
                instrumentId: v4_1.z.uuid(),
            }),
            body: v4_1.z.object({
                startDate: v4_1.z.date('Data inicial inválida'),
                defrostDate: v4_1.z.date('Data de descongelamento inválida'),
                endDate: v4_1.z.date('Data final inválida'),
                variation: v4_1.z.number(),
                initialTemp: v4_1.z.number().nullish(),
                averageTemp: v4_1.z.number().nullish(),
            }),
            response: {
                201: v4_1.z.object({
                    generatedData: v4_1.z.array(v4_1.z.object({
                        instrumentId: v4_1.z.uuid(),
                        createdAt: v4_1.z.date(),
                        data: v4_1.z.number(),
                        editData: v4_1.z.number(),
                        generateData: v4_1.z.number(),
                        userEditData: v4_1.z.string().nullable(),
                    })),
                }),
            },
        },
    }, async (request, reply) => {
        const { orgSlug, instrumentId } = request.params;
        const userId = await request.getCurrentUserId();
        const { membership } = await request.getUserMembership(orgSlug);
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        if (cannot('create', 'InstrumentData')) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed generate this instrument data.`);
        }
        const { endDate, startDate, variation, defrostDate, averageTemp, initialTemp, } = request.body;
        const instrument = await prisma_1.prisma.instrument.findUnique({
            where: {
                id: instrumentId,
            },
            select: {
                id: true,
                type: true,
            },
        });
        if (!instrument) {
            throw new bad_request_error_1.BadRequestError('Instrument not found.');
        }
        if (startDate >= endDate) {
            throw new bad_request_error_1.BadRequestError('Data inicial deve ser menor que a data final.');
        }
        const generatedData = (0, generate_data_1.generateInstrumentData)({
            instrumentId,
            type: instrument.type,
            startDate,
            endDate,
            defrostDate,
            variation,
            initialTemp: initialTemp ?? undefined,
            averageTemp: averageTemp ?? undefined,
        });
        await (0, generate_data_1.saveInstrumentData)(generatedData);
        return reply.status(201).send({ generatedData });
    });
}
