import { describe, expect, it, vi } from 'vitest'

import { buildTestApp, makePrismaMock } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { dashboardWs } = await import('./dashboard')

describe('GET /ws/dashboard', () => {
  it('registers the WebSocket route', async () => {
    const app = await buildTestApp({ websocket: true }, dashboardWs)
    const routes = app.printRoutes({ includeHooks: false, commonPrefix: false })
    expect(routes).toContain('/ws/dashboard')
  })
})
