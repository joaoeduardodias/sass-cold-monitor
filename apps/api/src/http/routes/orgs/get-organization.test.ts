import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { getOrganization } = await import('./get-organization')

describe('GET /organizations/:slug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(getOrganization)
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme',
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 when user is not a member', async () => {
    prismaMock.member.findFirst.mockResolvedValue(null)
    const app = await buildTestApp(getOrganization)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns organization when user is a member', async () => {
    prismaMock.member.findFirst.mockResolvedValue({
      id: uuid('memb'),
      role: 'ADMIN',
      organizationId: uuid('org'),
      userId: uuid('user'),
      organization: {
        id: uuid('org'),
        name: 'Acme',
        slug: 'acme',
        domain: null,
        shouldAttachUsersByDomain: false,
        avatarUrl: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        ownerId: uuid('user'),
      },
    })
    const app = await buildTestApp(getOrganization)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().organization.slug).toBe('acme')
  })
})
