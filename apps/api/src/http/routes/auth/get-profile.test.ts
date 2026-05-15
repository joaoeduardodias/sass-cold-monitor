import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { getProfile } = await import('./get-profile')

describe('GET /profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no token is provided', async () => {
    const app = await buildTestApp(getProfile)
    const response = await app.inject({ method: 'GET', url: '/profile' })
    expect(response.statusCode).toBe(401)
  })

  it('returns 500 when user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(getProfile)
    const token = await signToken(app, { sub: 'user-1' })

    const response = await app.inject({
      method: 'GET',
      url: '/profile',
      headers: authHeaders(token),
    })

    expect(response.statusCode).toBe(500)
  })

  it('returns user with permissions derived from memberships', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: uuid('user'),
      name: 'Jane',
      email: 'jane@test.com',
      avatarUrl: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
      member_on: [
        {
          id: uuid('memb'),
          role: 'ADMIN',
          isActive: true,
          createdAt: new Date('2026-01-01'),
          organization: {
            id: uuid('org-'),
            name: 'Acme',
            slug: 'acme',
          },
        },
      ],
    })
    const app = await buildTestApp(getProfile)
    const token = await signToken(app, { sub: 'user-1' })

    const response = await app.inject({
      method: 'GET',
      url: '/profile',
      headers: authHeaders(token),
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.user.id).toBe(uuid('user'))
    expect(body.user.permissions).toContain('Gerenciar sistema')
    expect(body.user.memberships[0].organization.slug).toBe('acme')
  })
})
