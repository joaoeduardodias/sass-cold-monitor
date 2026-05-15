import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { updateOrganization } = await import('./update-organization')

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

describe('PUT /organizations/:slug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(updateOrganization)
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme',
      payload: { name: 'New' },
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 when non-admin user tries to update', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    const app = await buildTestApp(updateOrganization)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme',
      headers: authHeaders(token),
      payload: { name: 'New' },
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 when domain already taken by another org', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.organization.findFirst.mockResolvedValue({ id: 'other' })
    const app = await buildTestApp(updateOrganization)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme',
      headers: authHeaders(token),
      payload: { name: 'New', domain: 'taken.com' },
    })
    expect(response.statusCode).toBe(400)
  })

  it('updates organization and returns 204', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.organization.findFirst.mockResolvedValue(null)
    prismaMock.organization.update.mockResolvedValue({})
    const app = await buildTestApp(updateOrganization)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme',
      headers: authHeaders(token),
      payload: { name: 'New Name' },
    })
    expect(response.statusCode).toBe(204)
    expect(prismaMock.organization.update).toHaveBeenCalledOnce()
  })
})
