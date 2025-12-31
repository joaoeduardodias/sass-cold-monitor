"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
const prisma_1 = require("@/lib/prisma");
const bcryptjs_1 = require("bcryptjs");
const v4_1 = require("zod/v4");
async function createUser(app) {
    app.withTypeProvider().post('/users', {
        schema: {
            tags: ['Auth'],
            summary: 'Create user.',
            body: v4_1.z.object({
                name: v4_1.z.string().min(1, "Name is required"),
                email: v4_1.z.email("Invalid e-mail format"),
                password: v4_1.z.string().min(6, "Password must be at least 6 characters long"),
            })
        }
    }, async (request, reply) => {
        const { name, email, password } = request.body;
        const userWithSameEmail = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (userWithSameEmail) {
            return reply.status(400).send({ error: "User with same e-mail already exists." });
        }
        const [, domain] = email.split('@');
        const autoJoinOrganization = await prisma_1.prisma.organization.findUnique({
            where: {
                domain,
                shouldAttachUsersByDomain: true,
            }
        });
        const passwordHash = await (0, bcryptjs_1.hash)(password, 6);
        await prisma_1.prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                member_on: autoJoinOrganization ? {
                    create: {
                        organizationId: autoJoinOrganization.id
                    }
                } : undefined
            }
        });
        return reply.status(201).send();
    });
}
