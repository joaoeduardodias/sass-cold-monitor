import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { getInstrumentBySlug } = await import('./get-instrument-by-slug')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

describe('GET /organizations/:orgSlug/instruments/:instrumentSlug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(getInstrumentBySlug)
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/instruments/sensor',
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 when instrument not found', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    prismaMock.instrument.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(getInstrumentBySlug)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/instruments/sensor',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(400)
  })

  it('returns instrument when found', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    prismaMock.instrument.findUnique.mockResolvedValue({
      id: uuid('inst'),
      name: 'Sensor',
      slug: 'sensor',
      type: 'TEMPERATURE',
      model: 1,
      maxValue: 10,
      minValue: -10,
      isActive: true,
      idSitrad: 1,
      orderDisplay: 1,
    })
    const app = await buildTestApp(getInstrumentBySlug)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/instruments/sensor',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().instrument.slug).toBe('sensor')
  })
})
