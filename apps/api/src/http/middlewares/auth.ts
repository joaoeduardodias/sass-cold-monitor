import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { UnauthorizedError } from "../routes/_errors/unauthorized-error";

export const auth = fastifyPlugin(
  async (app: FastifyInstance) => {
    app.addHook('preHandler', async (request) => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()
        return sub
      } catch (err) {
        throw new UnauthorizedError('Invalid auth token.')
      }
    })
  }
)