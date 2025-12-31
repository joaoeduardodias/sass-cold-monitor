"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateWithPassword = authenticateWithPassword;
const prisma_1 = require("@/lib/prisma");
const bcryptjs_1 = require("bcryptjs");
const v4_1 = require("zod/v4");
async function authenticateWithPassword(app) {
    app.withTypeProvider().post('/sessions/password', {
        schema: {
            tags: ['Auth'],
            summary: 'Authenticate with e-mail & password.',
            body: v4_1.z.object({
                email: v4_1.z.email("Invalid e-mail format"),
                password: v4_1.z.string().min(6, "Password must be at least 6 characters long"),
            })
        }
    }, async (request, reply) => {
        const { email, password } = request.body;
        const userFromEmail = await prisma_1.prisma.user.findUnique({
            where: {
                email
            }
        });
        if (!userFromEmail) {
            return reply.status(400).send({ message: "Invalid credentials." });
        }
        if (userFromEmail.passwordHash === null) {
            return reply.status(400).send({ message: "User does not have a password, use social login." });
        }
        const isPasswordValid = await (0, bcryptjs_1.compare)(password, userFromEmail.passwordHash);
        if (!isPasswordValid) {
            return reply.status(400).send({ message: "Invalid credentials." });
        }
        const token = await reply.jwtSign({
            sub: userFromEmail.id
        }, {
            sign: {
                expiresIn: '7d'
            }
        });
        return reply.status(201).send({ token });
    });
}
