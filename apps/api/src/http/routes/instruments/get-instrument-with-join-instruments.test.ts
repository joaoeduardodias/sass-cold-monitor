import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { getInstrumentsWithJoinInstruments } = await import(
  './get-instrument-with-join-instruments'
)

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

describe('GET /organization/:orgSlug/instrumentsWithJoinInstruments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(getInstrumentsWithJoinInstruments)
    const response = await app.inject({
      method: 'GET',
      url: '/organization/acme/instrumentsWithJoinInstruments',
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns combined instruments and join instruments', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    prismaMock.instrument.findMany.mockResolvedValue([
      { id: uuid('inst1'), name: 'Sensor A' },
    ])
    prismaMock.joinInstrument.findMany.mockResolvedValue([
      { id: uuid('join1'), name: 'Combined AB' },
    ])
    const app = await buildTestApp(getInstrumentsWithJoinInstruments)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/organization/acme/instrumentsWithJoinInstruments',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().instrumentsWithJoinInstruments).toHaveLength(2)
  })
})
