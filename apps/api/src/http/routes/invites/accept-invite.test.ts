import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { acceptInvite } = await import('./accept-invite')

describe('POST /invites/:inviteId/accept', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(acceptInvite)
    const response = await app.inject({
      method: 'POST',
      url: `/invites/${uuid('inv')}/accept`,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 if invite not found', async () => {
    prismaMock.invite.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(acceptInvite)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: `/invites/${uuid('inv')}/accept`,
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(400)
  })

  it('returns 400 if invite belongs to another user', async () => {
    prismaMock.invite.findUnique.mockResolvedValue({
      id: uuid('inv'),
      email: 'other@test.com',
      organizationId: uuid('org'),
      role: 'EDITOR',
    })
    prismaMock.user.findUnique.mockResolvedValue({
      id: uuid('user'),
      email: 'me@test.com',
    })
    const app = await buildTestApp(acceptInvite)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: `/invites/${uuid('inv')}/accept`,
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(400)
  })

  it('accepts invite and creates membership', async () => {
    prismaMock.invite.findUnique.mockResolvedValue({
      id: uuid('inv'),
      email: 'me@test.com',
      organizationId: uuid('org'),
      role: 'EDITOR',
    })
    prismaMock.user.findUnique.mockResolvedValue({
      id: uuid('user'),
      email: 'me@test.com',
    })
    prismaMock.$transaction.mockResolvedValue([{}, {}])
    const app = await buildTestApp(acceptInvite)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: `/invites/${uuid('inv')}/accept`,
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(204)
    expect(prismaMock.$transaction).toHaveBeenCalledOnce()
  })
})
