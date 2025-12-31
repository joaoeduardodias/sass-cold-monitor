"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrganization = createOrganization;
const v4_1 = require("zod/v4");
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const create_slug_1 = require("@/utils/create-slug");
const bad_request_error_1 = require("../_errors/bad-request-error");
async function createOrganization(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .post('/organization', {
        schema: {
            tags: ['Organization'],
            summary: 'Create a new organization.',
            security: [{ bearerAuth: [] }],
            body: v4_1.z.object({
                name: v4_1.z.string(),
                domain: v4_1.z.string().nullish(),
                shouldAttachUsersByDomain: v4_1.z.boolean().optional(),
            }),
            response: {
                201: v4_1.z.object({
                    organizationId: v4_1.z.uuid(),
                }),
            },
        },
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();
        const { name, domain, shouldAttachUsersByDomain } = request.body;
        if (domain) {
            const organizationByDomain = await prisma_1.prisma.organization.findUnique({
                where: { domain },
            });
            if (organizationByDomain) {
                throw new bad_request_error_1.BadRequestError('Another organization with same domain already exists.');
            }
        }
        const organization = await prisma_1.prisma.organization.create({
            data: {
                name,
                slug: (0, create_slug_1.createSlug)(name),
                domain,
                shouldAttachUsersByDomain,
                ownerId: userId,
                members: {
                    create: {
                        userId,
                        role: 'ADMIN',
                    },
                },
            },
        });
        return reply.status(201).send({
            organizationId: organization.id,
        });
    });
}
