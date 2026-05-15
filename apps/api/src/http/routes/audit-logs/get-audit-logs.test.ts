import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { getAuditLogs } = await import('./get-audit-logs')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

describe('GET /organizations/:orgSlug/audit-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(getAuditLogs)
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/audit-logs',
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns paginated logs aggregated from multiple sources', async () => {
    prismaMock.member.findFirst.mockResolvedValueOnce(asMember('ADMIN'))
    prismaMock.member.findMany.mockResolvedValue([
      {
        id: uuid('m'),
        createdAt: new Date('2026-05-01'),
        user: { name: 'Jane', email: 'jane@test.com' },
        role: 'EDITOR',
      },
    ])
    prismaMock.invite.findMany.mockResolvedValue([])
    prismaMock.instrument.findMany.mockResolvedValue([])
    prismaMock.instrumentData.findMany.mockResolvedValue([])
    prismaMock.notificationSettings.findUnique.mockResolvedValue(null)
    prismaMock.organization.findUnique.mockResolvedValue({
      id: uuid('org'),
      createdAt: new Date('2026-05-01'),
      updatedAt: new Date('2026-05-01'),
    })
    prismaMock.$queryRaw.mockResolvedValue([])

    const app = await buildTestApp(getAuditLogs)
    const token = await signToken(app, { sub: uuid('user') })

    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/audit-logs',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.logs.length).toBeGreaterThanOrEqual(1)
    expect(body.pagination.page).toBe(1)
  })

  it('returns 400 on invalid query params', async () => {
    const app = await buildTestApp(getAuditLogs)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/audit-logs?page=0',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(400)
  })
})
