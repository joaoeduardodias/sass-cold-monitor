import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { updateMember } = await import('./update-member')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

describe('PUT /organizations/:slug/members/:memberId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(updateMember)
    const response = await app.inject({
      method: 'PUT',
      url: `/organizations/acme/members/${uuid('m')}`,
      payload: { role: 'EDITOR' },
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 for viewer', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    const app = await buildTestApp(updateMember)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PUT',
      url: `/organizations/acme/members/${uuid('m')}`,
      headers: authHeaders(token),
      payload: { role: 'EDITOR' },
    })
    expect(response.statusCode).toBe(401)
  })

  it('updates member role when admin', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.member.update.mockResolvedValue({})
    const app = await buildTestApp(updateMember)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PUT',
      url: `/organizations/acme/members/${uuid('m')}`,
      headers: authHeaders(token),
      payload: { role: 'EDITOR' },
    })
    expect(response.statusCode).toBe(204)
  })
})
