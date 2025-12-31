"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateWithGoogle = authenticateWithGoogle;
const prisma_1 = require("@/lib/prisma");
const env_1 = require("@cold-monitor/env");
const v4_1 = require("zod/v4");
async function authenticateWithGoogle(app) {
    app.withTypeProvider().post('/sessions/google', {
        schema: {
            tags: ['Auth'],
            summary: 'Authenticate with Google.',
            body: v4_1.z.object({
                code: v4_1.z.string(),
            }),
            response: {
                201: v4_1.z.object({
                    token: v4_1.z.string(),
                })
            }
        }
    }, async (request, reply) => {
        // URL para passar no front para fazer o login - url de autorização
        // https://accounts.google.com/o/oauth2/v2/auth?client_id=1041206287799-u65ib35rlr5kkgi60ds2bdvik835mssl.apps.googleusercontent.com&redirect_uri=http://localhost:3000/api/auth/callback&response_type=code&scope=https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile&access_type=offline&prompt=consent
        const { code } = request.body;
        const formattedCode = decodeURIComponent(code);
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: formattedCode,
                client_id: env_1.env.GOOGLE_OAUTH_CLIENT_ID,
                client_secret: env_1.env.GOOGLE_OAUTH_CLIENT_SECRET,
                redirect_uri: env_1.env.GOOGLE_OAUTH_CLIENT_REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        });
        const tokenGoogle = await tokenResponse.json();
        const { access_token: AccessTokenGoogle } = v4_1.z.object({
            access_token: v4_1.z.string(),
            expires_in: v4_1.z.number(),
            refresh_token: v4_1.z.string(),
            scope: v4_1.z.string(),
            token_type: v4_1.z.literal('Bearer'),
            id_token: v4_1.z.string(),
        }).parse(tokenGoogle);
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${AccessTokenGoogle}`,
            },
        });
        const googleUserData = await userInfoResponse.json();
        const { id: googleId, email, name, picture: avatarUrl } = v4_1.z.object({
            id: v4_1.z.string(),
            email: v4_1.z.email(),
            name: v4_1.z.string(),
            picture: v4_1.z.url()
        }).parse(googleUserData);
        let user = await prisma_1.prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            user = await prisma_1.prisma.user.create({
                data: {
                    name,
                    email,
                    avatarUrl,
                }
            });
        }
        let account = await prisma_1.prisma.account.findUnique({
            where: {
                provider_userId: {
                    provider: 'GOOGLE',
                    userId: user.id,
                }
            }
        });
        if (!account) {
            account = await prisma_1.prisma.account.create({
                data: {
                    provider: 'GOOGLE',
                    providerAccountId: googleId,
                    userId: user.id
                }
            });
        }
        const token = await reply.jwtSign({
            sub: user.id
        }, {
            sign: {
                expiresIn: '7d'
            }
        });
        return reply.status(201).send({ token });
    });
}
