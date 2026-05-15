import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { getInstruments } = await import('./get-instruments')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: {
      id: uuid('org'),
      slug: 'acme',
      name: 'Acme',
    },
  }
}

describe('GET /organization/:orgSlug/instruments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(getInstruments)
    const response = await app.inject({
      method: 'GET',
      url: '/organization/acme/instruments',
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns instruments for member with permission', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    prismaMock.instrument.findMany.mockResolvedValue([
      {
        id: uuid('inst'),
        name: 'Sensor',
        slug: 'sensor',
        model: 1,
        orderDisplay: 1,
        maxValue: 10,
        minValue: -10,
        isActive: true,
        type: 'TEMPERATURE',
        idSitrad: 1,
      },
    ])
    const app = await buildTestApp(getInstruments)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/organization/acme/instruments',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().instruments).toHaveLength(1)
  })
})
