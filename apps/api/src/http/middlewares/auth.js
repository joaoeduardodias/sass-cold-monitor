"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const prisma_1 = require("@/lib/prisma");
const unauthorized_error_1 = require("../routes/_errors/unauthorized-error");
exports.auth = (0, fastify_plugin_1.default)(async (app) => {
    app.addHook('preHandler', async (request) => {
        request.getCurrentUserId = async () => {
            try {
                const { sub } = await request.jwtVerify();
                return sub;
            }
            catch (err) {
                throw new unauthorized_error_1.UnauthorizedError('Invalid auth token.');
            }
        };
        request.getUserMembership = async (slug) => {
            const userId = await request.getCurrentUserId();
            const member = await prisma_1.prisma.member.findFirst({
                where: {
                    userId,
                    organization: {
                        slug,
                    },
                },
                include: {
                    organization: true,
                },
            });
            if (!member) {
                throw new unauthorized_error_1.UnauthorizedError(`You're not a member of this organization.`);
            }
            const { organization, ...membership } = member;
            return {
                organization,
                membership,
            };
        };
    });
});
