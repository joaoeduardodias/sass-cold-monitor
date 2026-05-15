import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { getAlertReadSignatures } = await import('./get-alert-read-signatures')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

describe('GET /organizations/:slug/alerts/read-signatures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(getAlertReadSignatures)
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/alerts/read-signatures',
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns rows from raw query', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.$queryRaw.mockResolvedValue([
      {
        instrumentId: uuid('inst'),
        signature: 'sig-1',
        readAt: new Date(),
      },
    ])
    const app = await buildTestApp(getAlertReadSignatures)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/alerts/read-signatures',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().readSignatures).toHaveLength(1)
  })
})
