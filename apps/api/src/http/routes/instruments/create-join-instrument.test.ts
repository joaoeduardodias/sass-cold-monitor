import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { createJoinInstrument } = await import('./create-join-instrument')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

const payload = {
  name: 'Combined',
  firstInstrumentId: uuid('inst1'),
  secondInstrumentId: uuid('inst2'),
}

describe('POST /organizations/:slug/joinInstrument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(createJoinInstrument)
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/joinInstrument',
      payload,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 for viewer', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    prismaMock.instrument.findMany.mockResolvedValue([
      { id: payload.firstInstrumentId },
      { id: payload.secondInstrumentId },
    ])
    const app = await buildTestApp(createJoinInstrument)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/joinInstrument',
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(401)
  })

  it('creates join instrument for admin', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.instrument.findMany.mockResolvedValue([
      { id: payload.firstInstrumentId },
      { id: payload.secondInstrumentId },
    ])
    prismaMock.joinInstrument.create.mockResolvedValue({ id: uuid('join') })
    const app = await buildTestApp(createJoinInstrument)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/joinInstrument',
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(201)
    expect(response.json().joinInstrumentId).toBe(uuid('join'))
  })
})
