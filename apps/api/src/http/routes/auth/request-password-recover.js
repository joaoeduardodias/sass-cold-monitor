"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestPasswordRecover = requestPasswordRecover;
const prisma_1 = require("@/lib/prisma");
const v4_1 = require("zod/v4");
async function requestPasswordRecover(app) {
    app.withTypeProvider().post('/password/recover', {
        schema: {
            tags: ['Auth'],
            summary: 'Password Recover.',
            body: v4_1.z.object({
                email: v4_1.z.email(),
            }),
            response: {
                201: v4_1.z.null()
            }
        }
    }, async (request, reply) => {
        const { email } = request.body;
        const userFromEmail = await prisma_1.prisma.user.findUnique({
            where: {
                email
            }
        });
        if (!userFromEmail) {
            // We don't want people to know if user really exists
            return reply.status(201).send();
        }
        const { id: code } = await prisma_1.prisma.token.create({
            data: {
                type: 'PASSWORD_RECOVER',
                userId: userFromEmail.id
            }
        });
        // Send e-mail with password recover link
        console.log("Recover password token: ", code);
        return reply.status(201).send();
    });
}
