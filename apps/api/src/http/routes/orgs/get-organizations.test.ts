import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { getOrganizations } = await import('./get-organizations')

describe('GET /organizations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(getOrganizations)
    const response = await app.inject({ method: 'GET', url: '/organizations' })
    expect(response.statusCode).toBe(401)
  })

  it('returns user organizations with role', async () => {
    prismaMock.organization.findMany.mockResolvedValue([
      {
        id: uuid('org'),
        name: 'Acme',
        slug: 'acme',
        avatarUrl: null,
        members: [{ role: 'ADMIN' }],
      },
    ])
    const app = await buildTestApp(getOrganizations)
    const token = await signToken(app, { sub: uuid('user') })

    const response = await app.inject({
      method: 'GET',
      url: '/organizations',
      headers: authHeaders(token),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().organizations[0].role).toBe('ADMIN')
  })
})
