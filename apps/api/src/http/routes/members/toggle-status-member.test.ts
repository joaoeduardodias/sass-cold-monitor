import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { toggleStatusMember } = await import('./toggle-status-member')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

describe('PATCH /organizations/:slug/members/:memberId/status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(toggleStatusMember)
    const response = await app.inject({
      method: 'PATCH',
      url: `/organizations/acme/members/${uuid('m')}/status`,
      payload: { status: 'inactive' },
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 for viewer', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    const app = await buildTestApp(toggleStatusMember)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PATCH',
      url: `/organizations/acme/members/${uuid('m')}/status`,
      headers: authHeaders(token),
      payload: { status: 'inactive' },
    })
    expect(response.statusCode).toBe(401)
  })

  it('toggles status when admin', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.member.update.mockResolvedValue({})
    const app = await buildTestApp(toggleStatusMember)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PATCH',
      url: `/organizations/acme/members/${uuid('m')}/status`,
      headers: authHeaders(token),
      payload: { status: 'active' },
    })
    expect(response.statusCode).toBe(204)
    const call = prismaMock.member.update.mock.calls[0][0]
    expect(call.data.isActive).toBe(true)
  })
})
