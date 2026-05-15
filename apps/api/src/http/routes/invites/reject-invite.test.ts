import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { rejectInvite } = await import('./reject-invite')

describe('DELETE /invites/:inviteId/reject', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(rejectInvite)
    const response = await app.inject({
      method: 'DELETE',
      url: `/invites/${uuid('inv')}/reject`,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 if invite not found', async () => {
    prismaMock.invite.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(rejectInvite)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'DELETE',
      url: `/invites/${uuid('inv')}/reject`,
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(400)
  })

  it('deletes the invite', async () => {
    prismaMock.invite.findUnique.mockResolvedValue({
      id: uuid('inv'),
      email: 'me@test.com',
    })
    prismaMock.user.findUnique.mockResolvedValue({
      id: uuid('user'),
      email: 'me@test.com',
    })
    prismaMock.invite.delete.mockResolvedValue({})
    const app = await buildTestApp(rejectInvite)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'DELETE',
      url: `/invites/${uuid('inv')}/reject`,
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(204)
  })
})
