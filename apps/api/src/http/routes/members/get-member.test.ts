import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { getMembers } = await import('./get-member')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

describe('GET /organizations/:slug/members', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(getMembers)
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/members',
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 for viewer', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    const app = await buildTestApp(getMembers)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/members',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns members list for admin', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.member.findMany.mockResolvedValue([
      {
        id: uuid('memb'),
        role: 'EDITOR',
        isActive: true,
        user: {
          id: uuid('u1'),
          name: 'Jane',
          email: 'jane@test.com',
          avatarUrl: null,
        },
      },
    ])
    const app = await buildTestApp(getMembers)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/members',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(201)
    expect(response.json().members[0].email).toBe('jane@test.com')
  })
})
