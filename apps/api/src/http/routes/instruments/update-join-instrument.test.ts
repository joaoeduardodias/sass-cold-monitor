import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

// This file exports a function named `updateInstrument` but defines the
// PUT /organizations/:slug/joinInstrument route (legacy file).
const { updateInstrument: updateJoinInstrument } = await import(
  './update-join-instrument'
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

const item = {
  id: uuid('join'),
  name: 'Combined',
  isActive: true,
  firstInstrumentId: uuid('inst1'),
  secondInstrumentId: uuid('inst2'),
}

describe('PUT /organizations/:slug/joinInstrument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(updateJoinInstrument)
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme/joinInstrument',
      payload: { joinInstruments: [item] },
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 for viewer role', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => Promise<unknown>) => {
      return cb(prismaMock)
    })
    const app = await buildTestApp(updateJoinInstrument)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme/joinInstrument',
      headers: authHeaders(token),
      payload: { joinInstruments: [item] },
    })
    expect(response.statusCode).toBe(401)
  })

  it('updates join instruments for admin', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => Promise<unknown>) => {
      const tx = {
        ...prismaMock,
        joinInstrument: {
          ...prismaMock.joinInstrument,
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      }
      return cb(tx as typeof prismaMock)
    })
    const app = await buildTestApp(updateJoinInstrument)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme/joinInstrument',
      headers: authHeaders(token),
      payload: { joinInstruments: [item] },
    })
    expect(response.statusCode).toBe(204)
  })
})
