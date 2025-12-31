"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = resetPassword;
const prisma_1 = require("@/lib/prisma");
const bcryptjs_1 = require("bcryptjs");
const v4_1 = require("zod/v4");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
async function resetPassword(app) {
    app.withTypeProvider().post('/password/reset', {
        schema: {
            tags: ['Auth'],
            summary: 'Password Reset.',
            body: v4_1.z.object({
                code: v4_1.z.string(),
                password: v4_1.z.string().min(6, "Password must be at least 6 characters long"),
            }),
            response: {
                204: v4_1.z.null()
            }
        }
    }, async (request, reply) => {
        const { code, password } = request.body;
        const tokenFromCode = await prisma_1.prisma.token.findUnique({
            where: {
                id: code
            }
        });
        if (!tokenFromCode) {
            throw new unauthorized_error_1.UnauthorizedError();
        }
        const passwordHash = await (0, bcryptjs_1.hash)(password, 6);
        await prisma_1.prisma.user.update({
            where: {
                id: tokenFromCode.userId,
            },
            data: {
                passwordHash
            }
        });
        return reply.status(204).send();
    });
}
