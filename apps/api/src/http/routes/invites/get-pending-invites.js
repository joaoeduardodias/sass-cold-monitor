"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingInvites = getPendingInvites;
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const auth_2 = require("@cold-monitor/auth");
const v4_1 = require("zod/v4");
const bad_request_error_1 = require("../_errors/bad-request-error");
async function getPendingInvites(app) {
    app.withTypeProvider().register(auth_1.auth).get('/pending-invites', {
        schema: {
            tags: ['Invites'],
            summary: 'Get all user pending invites.',
            response: {
                200: v4_1.z.object({
                    invites: v4_1.z.array(v4_1.z.object({
                        id: v4_1.z.uuid(),
                        email: v4_1.z.email(),
                        createdAt: v4_1.z.date(),
                        role: auth_2.roleSchema,
                        author: v4_1.z.object({
                            id: v4_1.z.uuid(),
                            name: v4_1.z.string().nullable(),
                            avatarUrl: v4_1.z.url().nullable(),
                        }).nullable(),
                        organization: v4_1.z.object({
                            name: v4_1.z.string(),
                        })
                    }))
                })
            }
        }
    }, async (request) => {
        const userId = await request.getCurrentUserId();
        const user = await prisma_1.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new bad_request_error_1.BadRequestError('User not found.');
        }
        const invites = await prisma_1.prisma.invite.findMany({
            where: {
                email: user.email
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    }
                },
                organization: {
                    select: {
                        name: true
                    }
                }
            }
        });
        return { invites };
    });
}
