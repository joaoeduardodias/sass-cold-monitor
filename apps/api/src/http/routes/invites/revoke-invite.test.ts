import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { revokeInvite } = await import('./revoke-invite')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

describe('POST /organizations/:slug/invites/:inviteId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(revokeInvite)
    const response = await app.inject({
      method: 'POST',
      url: `/organizations/acme/invites/${uuid('inv')}`,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 for viewer', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    const app = await buildTestApp(revokeInvite)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: `/organizations/acme/invites/${uuid('inv')}`,
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 when invite not found', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.invite.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(revokeInvite)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: `/organizations/acme/invites/${uuid('inv')}`,
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(400)
  })

  it('revokes invite when admin', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.invite.findUnique.mockResolvedValue({ id: uuid('inv') })
    prismaMock.invite.delete.mockResolvedValue({})
    const app = await buildTestApp(revokeInvite)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: `/organizations/acme/invites/${uuid('inv')}`,
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(204)
  })
})
