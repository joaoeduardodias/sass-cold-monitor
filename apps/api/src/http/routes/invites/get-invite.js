"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvite = getInvite;
const prisma_1 = require("@/lib/prisma");
const auth_1 = require("@cold-monitor/auth");
const v4_1 = require("zod/v4");
const bad_request_error_1 = require("../_errors/bad-request-error");
async function getInvite(app) {
    app.withTypeProvider().get('/invites/:inviteId', {
        schema: {
            tags: ['Invites'],
            summary: 'Get an invite.',
            params: v4_1.z.object({
                inviteId: v4_1.z.url()
            }),
            response: {
                200: v4_1.z.object({
                    invite: v4_1.z.object({
                        id: v4_1.z.uuid(),
                        email: v4_1.z.email(),
                        createdAt: v4_1.z.date(),
                        role: auth_1.roleSchema,
                        author: v4_1.z.object({
                            id: v4_1.z.uuid(),
                            name: v4_1.z.string().nullable(),
                            avatarUrl: v4_1.z.url().nullable(),
                        }).nullable(),
                        organization: v4_1.z.object({
                            name: v4_1.z.string(),
                        })
                    })
                })
            }
        }
    }, async (request) => {
        const { inviteId } = request.params;
        const invite = await prisma_1.prisma.invite.findUnique({
            where: {
                id: inviteId
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
        if (!invite) {
            throw new bad_request_error_1.BadRequestError('Invite not found.');
        }
        return { invite };
    });
}
