import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { transferOrganization } = await import('./transfer-organization')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER', userId = uuid('user')) {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId,
    organization: {
      id: uuid('org'),
      name: 'Acme',
      slug: 'acme',
      domain: null,
      shouldAttachUsersByDomain: false,
      avatarUrl: null,
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }
}

describe('PATCH /organizations/:slug/owner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(transferOrganization)
    const response = await app.inject({
      method: 'PATCH',
      url: '/organizations/acme/owner',
      payload: { transferToUserId: uuid('tgt') },
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 when caller has insufficient role', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    const app = await buildTestApp(transferOrganization)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PATCH',
      url: '/organizations/acme/owner',
      headers: authHeaders(token),
      payload: { transferToUserId: uuid('tgt') },
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 if target is not a member', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.member.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(transferOrganization)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PATCH',
      url: '/organizations/acme/owner',
      headers: authHeaders(token),
      payload: { transferToUserId: uuid('tgt') },
    })
    expect(response.statusCode).toBe(400)
  })

  it('transfers ownership in a transaction', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.member.findUnique.mockResolvedValue({ id: uuid('memb') })
    prismaMock.$transaction.mockResolvedValue([{}, {}])
    const app = await buildTestApp(transferOrganization)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PATCH',
      url: '/organizations/acme/owner',
      headers: authHeaders(token),
      payload: { transferToUserId: uuid('tgt') },
    })
    expect(response.statusCode).toBe(204)
    expect(prismaMock.$transaction).toHaveBeenCalledOnce()
  })
})
