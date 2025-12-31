"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const v4_1 = require("zod/v4");
async function getProfile(app) {
    app.withTypeProvider().register(auth_1.auth).get('/profile', {
        schema: {
            tags: ['Auth'],
            summary: 'Get authenticated user profile.',
            security: [
                { bearerAuth: [] }
            ],
            response: {
                200: v4_1.z.object({
                    user: v4_1.z.object({
                        id: v4_1.z.uuid(),
                        name: v4_1.z.string(),
                        email: v4_1.z.email(),
                        avatarUrl: v4_1.z.url().nullable()
                    })
                })
            }
        }
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();
        const user = await prisma_1.prisma.user.findUnique({
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
            },
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new Error("User not found.");
        }
        return reply.send({ user });
    });
}
