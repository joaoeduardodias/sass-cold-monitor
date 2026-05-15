import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { getPendingInvites } = await import('./get-pending-invites')

describe('GET /pending-invites', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(getPendingInvites)
    const response = await app.inject({
      method: 'GET',
      url: '/pending-invites',
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 if user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(getPendingInvites)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/pending-invites',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(400)
  })

  it('returns invites for user email', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: uuid('user'),
      email: 'a@b.com',
    })
    prismaMock.invite.findMany.mockResolvedValue([
      {
        id: uuid('inv'),
        email: 'a@b.com',
        role: 'EDITOR',
        createdAt: new Date(),
        author: { id: uuid('user'), name: 'Jane', avatarUrl: null },
        organization: { name: 'Acme' },
      },
    ])
    const app = await buildTestApp(getPendingInvites)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/pending-invites',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().invites).toHaveLength(1)
  })
})
