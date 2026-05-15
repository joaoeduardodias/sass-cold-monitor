import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { updateDifferentialInstrument } = await import(
  './update-differential-instruments'
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

describe('PATCH /organizations/:orgSlug/instruments/:instrumentId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(updateDifferentialInstrument)
    const response = await app.inject({
      method: 'PATCH',
      url: `/organizations/acme/instruments/${uuid('inst')}`,
      payload: { differential: 2 },
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 when instrument not found', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.instrument.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(updateDifferentialInstrument)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PATCH',
      url: `/organizations/acme/instruments/${uuid('inst')}`,
      headers: authHeaders(token),
      payload: { differential: 2 },
    })
    expect(response.statusCode).toBe(400)
  })

  it('updates differential for admin', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.instrument.findUnique.mockResolvedValue({
      __typename: 'Instrument',
      idSitrad: 1,
      id: uuid('inst'),
      organization_id: uuid('org'),
      name: 'Sensor',
      model: 1,
    })
    const app = await buildTestApp(updateDifferentialInstrument)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PATCH',
      url: `/organizations/acme/instruments/${uuid('inst')}`,
      headers: authHeaders(token),
      payload: { differential: 2 },
    })
    expect(response.statusCode).toBe(204)
  })

  it('returns 400 when differential out of range', async () => {
    const app = await buildTestApp(updateDifferentialInstrument)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PATCH',
      url: `/organizations/acme/instruments/${uuid('inst')}`,
      headers: authHeaders(token),
      payload: { differential: 5000 },
    })
    expect(response.statusCode).toBe(400)
  })
})
