import { describe, expect, it, vi } from 'vitest'

import { buildTestApp, makePrismaMock } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { agentWs } = await import('./agent')

describe('GET /ws/agent', () => {
  it('registers the WebSocket route', async () => {
    const app = await buildTestApp({ websocket: true }, agentWs)
    const routes = app.printRoutes({ includeHooks: false, commonPrefix: false })
    expect(routes).toContain('/ws/agent')
  })
})
