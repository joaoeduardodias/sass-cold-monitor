import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { getData } = await import('./get-data')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

const queryString = 'startDate=2026-01-01&endDate=2026-01-02&chartVariation=5'

describe('GET /organizations/:orgSlug/instruments/:instrumentSlug/data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(getData)
    const response = await app.inject({
      method: 'GET',
      url: `/organizations/acme/instruments/sensor/data?${queryString}`,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 for operator role (no InstrumentData permission)', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('OPERATOR'))
    const app = await buildTestApp(getData)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: `/organizations/acme/instruments/sensor/data?${queryString}`,
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 when instrument and join instrument not found', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.instrument.findFirst.mockResolvedValue(null)
    prismaMock.instrument.findUnique.mockResolvedValue(null)
    prismaMock.joinInstrument.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(getData)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: `/organizations/acme/instruments/sensor/data?${queryString}`,
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(400)
  })

  it('returns data for a temperature instrument', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.instrument.findFirst.mockResolvedValue({
      id: uuid('inst'),
      name: 'Sensor',
      type: 'TEMPERATURE',
      data: [],
    })
    const app = await buildTestApp(getData)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: `/organizations/acme/instruments/sensor/data?${queryString}`,
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().data.type).toBe('TEMPERATURE')
  })
})
