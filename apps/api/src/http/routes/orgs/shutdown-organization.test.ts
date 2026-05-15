import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { shutdownOrganization } = await import('./shutdown-organization')

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

describe('DELETE /organizations/:slug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(shutdownOrganization)
    const response = await app.inject({
      method: 'DELETE',
      url: '/organizations/acme',
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 when role lacks permission', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    const app = await buildTestApp(shutdownOrganization)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'DELETE',
      url: '/organizations/acme',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(401)
  })

  it('deletes the org when caller has admin role', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.organization.delete.mockResolvedValue({})
    const app = await buildTestApp(shutdownOrganization)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'DELETE',
      url: '/organizations/acme',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(204)
    expect(prismaMock.organization.delete).toHaveBeenCalledOnce()
  })
})
