"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMembership = getMembership;
const auth_1 = require("@/http/middlewares/auth");
const auth_2 = require("@cold-monitor/auth");
const v4_1 = require("zod/v4");
async function getMembership(app) {
    app.withTypeProvider().register(auth_1.auth).get('/organizations/:slug/membership', {
        schema: {
            tags: ['Organization'],
            summary: 'Get user membership on organization.',
            security: [{ bearerAuth: [] }],
            params: v4_1.z.object({
                slug: v4_1.z.string(),
            }),
            response: {
                200: v4_1.z.object({
                    membership: v4_1.z.object({
                        id: v4_1.z.uuid(),
                        role: auth_2.roleSchema,
                        organizationId: v4_1.z.uuid()
                    }),
                }),
            },
        },
    }, async (request) => {
        const { slug } = request.params;
        const { membership } = await request.getUserMembership(slug);
        return {
            membership: {
                id: membership.id,
                role: auth_2.roleSchema.parse(membership.role),
                organizationId: membership.organizationId,
            }
        };
    });
}
