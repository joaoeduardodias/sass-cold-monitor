"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDifferentialInstrument = updateDifferentialInstrument;
const auth_1 = require("@cold-monitor/auth");
const v4_1 = require("zod/v4");
const auth_2 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const bad_request_error_1 = require("../_errors/bad-request-error");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function updateDifferentialInstrument(app) {
    app
        .withTypeProvider()
        .register(auth_2.auth)
        .patch('/organizations/:orgSlug/instruments/:instrumentId', {
        schema: {
            tags: ['Instruments'],
            summary: 'Update Differential instrument.',
            security: [{ bearerAuth: [] }],
            body: v4_1.z.object({
                differential: v4_1.z.number().min(0).max(1000),
            }),
            params: v4_1.z.object({
                orgSlug: v4_1.z.string(),
                instrumentId: v4_1.z.uuid(),
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
        const { differential } = request.body;
        const { instrumentId } = request.params;
        const instrument = await prisma_1.prisma.instrument.findUnique({
            where: {
                id: instrumentId,
            },
            select: {
                idSitrad: true,
                id: true,
                name: true,
                model: true,
            },
        });
        if (!instrument) {
            throw new bad_request_error_1.BadRequestError('Instrumento não encontrado.');
        }
        const authInstrument = auth_1.instrumentSchema.parse(instrument);
        if (cannot('update', authInstrument)) {
            throw new unauthorized_error_1.UnauthorizedError('Você não tem permissão para atualizar este instrumento.');
        }
        //  CRIAR ESTRATÉGIA PARA ATUALIZAR O DIFERENCIAL NO SITRAD
        // await fetch(`https://api.sitrad.com.br/v1/instruments/${instrument.idSitrad}`, {
        //   method: 'PATCH',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     Authorization: `Bearer ${process.env.SITRAD_API_KEY}`,
        //   },
        //   body: JSON.stringify({
        //     differential,
        //   }),
        // })
        console.log(differential);
        return reply.status(204).send();
    });
}
