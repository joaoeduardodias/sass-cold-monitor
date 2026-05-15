import fastifyJwt from '@fastify/jwt'
import fastifyWebsocket from '@fastify/websocket'
import { fastify, type FastifyInstance } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { vi } from 'vitest'

import { errorHandler } from '@/http/error-handler'

export const TEST_JWT_SECRET = 'test-secret'

export function uuid(seed: number | string = 1) {
  const raw = String(seed)
  let hex = ''
  for (let i = 0; i < raw.length; i++) {
    hex += raw.charCodeAt(i).toString(16)
  }
  hex = hex.padStart(12, '0').slice(-12)
  return `11111111-1111-4111-8111-${hex}`
}

export type RoutePlugin = (app: FastifyInstance) => Promise<void>

export interface BuildTestAppOptions {
  websocket?: boolean
}

export async function buildTestApp(...plugins: RoutePlugin[]): Promise<FastifyInstance>
export async function buildTestApp(
  options: BuildTestAppOptions,
  ...plugins: RoutePlugin[]
): Promise<FastifyInstance>
export async function buildTestApp(
  optionsOrPlugin: BuildTestAppOptions | RoutePlugin,
  ...rest: RoutePlugin[]
) {
  const isOptions =
    typeof optionsOrPlugin === 'object' && optionsOrPlugin !== null
  const options: BuildTestAppOptions = isOptions
    ? (optionsOrPlugin as BuildTestAppOptions)
    : {}
  const plugins: RoutePlugin[] = isOptions
    ? rest
    : [optionsOrPlugin as RoutePlugin, ...rest]

  const app = fastify().withTypeProvider<ZodTypeProvider>()
  app.setSerializerCompiler(serializerCompiler)
  app.setValidatorCompiler(validatorCompiler)
  app.setErrorHandler(errorHandler)
  await app.register(fastifyJwt, { secret: TEST_JWT_SECRET })
  if (options.websocket) {
    await app.register(fastifyWebsocket)
  }

  for (const plugin of plugins) {
    await app.register(plugin)
  }

  await app.ready()
  return app
}

export async function signToken(
  app: FastifyInstance,
  payload: Record<string, unknown> = { sub: 'test-user-id' },
) {
  return app.jwt.sign(payload)
}

export function authHeaders(token: string) {
  return { authorization: `Bearer ${token}` }
}

export function resetPrismaMocks(prisma: unknown) {
  const visit = (obj: unknown) => {
    if (!obj || typeof obj !== 'object') return
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const value = (obj as Record<string, unknown>)[key]
      if (typeof value === 'function' && 'mockReset' in value) {
        ;(value as { mockReset: () => void }).mockReset()
      } else if (value && typeof value === 'object') {
        visit(value)
      }
    }
  }
  visit(prisma)
}

export function makePrismaMock() {
  const model = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(),
  })

  return {
    user: model(),
    organization: model(),
    member: model(),
    invite: model(),
    token: model(),
    account: model(),
    instrument: model(),
    joinInstrument: model(),
    instrumentData: model(),
    notificationSettings: model(),
    collectorDevice: model(),
    alertReadLog: model(),
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  }
}
