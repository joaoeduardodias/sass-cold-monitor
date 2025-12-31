"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectInvite = rejectInvite;
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const v4_1 = require("zod/v4");
const bad_request_error_1 = require("../_errors/bad-request-error");
async function rejectInvite(app) {
    app.withTypeProvider().register(auth_1.auth).delete('/invites/:inviteId/reject', {
        schema: {
            tags: ['Invites'],
            summary: 'Reject an invite.',
            params: v4_1.z.object({
                inviteId: v4_1.z.url()
            }),
            response: {
                204: v4_1.z.null()
            }
        }
    }, async (request, reply) => {
        const userId = await request.getCurrentUserId();
        const { inviteId } = request.params;
        const invite = await prisma_1.prisma.invite.findUnique({
            where: {
                id: inviteId
            },
        });
        if (!invite) {
            throw new bad_request_error_1.BadRequestError('Invite not found or expired.');
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new bad_request_error_1.BadRequestError('User not found.');
        }
        if (invite.email !== user.email) {
            throw new bad_request_error_1.BadRequestError('This invite belongs to another  user.');
        }
        await prisma_1.prisma.invite.delete({
            where: {
                id: inviteId
            }
        });
        return reply.status(204).send();
    });
}
