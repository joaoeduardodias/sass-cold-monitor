import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { getMembership } = await import('./get-membership')

describe('GET /organization/:slug/membership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(getMembership)
    const response = await app.inject({
      method: 'GET',
      url: '/organization/acme/membership',
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns membership info', async () => {
    prismaMock.member.findFirst.mockResolvedValue({
      id: uuid('memb'),
      role: 'EDITOR',
      organizationId: uuid('org'),
      userId: uuid('user'),
      organization: {
        id: uuid('org'),
        slug: 'acme',
      },
    })
    const app = await buildTestApp(getMembership)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/organization/acme/membership',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().membership.role).toBe('EDITOR')
  })
})
