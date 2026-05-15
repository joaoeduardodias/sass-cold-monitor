import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { markAlertAsRead } = await import('./mark-alert-as-read')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

const payload = {
  instrumentId: uuid('inst'),
  signature: 'sig-1',
  severity: 'critical' as const,
  value: 12,
  minThreshold: 0,
  maxThreshold: 10,
  thresholdType: 'max' as const,
  alertTimestamp: new Date().toISOString(),
}

describe('POST /organizations/:slug/alerts/read', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(markAlertAsRead)
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/alerts/read',
      payload,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 when instrument is not in organization', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.instrument.findFirst.mockResolvedValue(null)
    const app = await buildTestApp(markAlertAsRead)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/alerts/read',
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(400)
  })

  it('inserts alert read log', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.instrument.findFirst.mockResolvedValue({ id: uuid('inst') })
    prismaMock.$executeRaw.mockResolvedValue(1)
    const app = await buildTestApp(markAlertAsRead)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/alerts/read',
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(204)
    expect(prismaMock.$executeRaw).toHaveBeenCalledOnce()
  })
})
