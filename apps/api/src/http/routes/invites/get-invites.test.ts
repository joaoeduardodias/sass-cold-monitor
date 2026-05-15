import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { getInvites } = await import('./get-invites')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

describe('GET /organizations/:slug/invites', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(getInvites)
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/invites',
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 for viewer role', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    const app = await buildTestApp(getInvites)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/invites',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns invites for admin', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.invite.findMany.mockResolvedValue([
      {
        id: uuid('inv'),
        email: 'a@b.com',
        role: 'EDITOR',
        createdAt: new Date(),
        author: { id: uuid('user'), name: 'Jane' },
      },
    ])
    const app = await buildTestApp(getInvites)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/invites',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().invites).toHaveLength(1)
  })
})
