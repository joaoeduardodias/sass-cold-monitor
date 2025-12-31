"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganization = getOrganization;
const v4_1 = require("zod/v4");
const auth_1 = require("@/http/middlewares/auth");
async function getOrganization(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .get('/organizations/:slug', {
        schema: {
            tags: ['Organization'],
            summary: 'Get details from organization.',
            security: [{ bearerAuth: [] }],
            params: v4_1.z.object({
                slug: v4_1.z.string(),
            }),
            response: {
                200: v4_1.z.object({
                    organization: v4_1.z.object({
                        id: v4_1.z.uuid(),
                        name: v4_1.z.string(),
                        slug: v4_1.z.string(),
                        domain: v4_1.z.string().nullable(),
                        shouldAttachUsersByDomain: v4_1.z.boolean(),
                        avatarUrl: v4_1.z.url().nullable(),
                        createdAt: v4_1.z.date(),
                        updatedAt: v4_1.z.date(),
                        ownerId: v4_1.z.uuid(),
                    }),
                }),
            },
        },
    }, async (request) => {
        const { slug } = request.params;
        const { organization } = await request.getUserMembership(slug);
        return { organization };
    });
}
