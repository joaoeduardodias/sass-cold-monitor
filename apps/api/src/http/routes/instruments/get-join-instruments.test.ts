import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { getJoinInstruments } = await import('./get-join-instruments')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

describe('GET /organization/:orgSlug/joinInstruments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(getJoinInstruments)
    const response = await app.inject({
      method: 'GET',
      url: '/organization/acme/joinInstruments',
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns join instruments list', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    prismaMock.joinInstrument.findMany.mockResolvedValue([
      {
        id: uuid('join'),
        name: 'Combined',
        isActive: true,
        firstInstrument: { id: uuid('inst1'), name: 'A' },
        secondInstrument: { id: uuid('inst2'), name: 'B' },
      },
    ])
    const app = await buildTestApp(getJoinInstruments)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/organization/acme/joinInstruments',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().joinInstruments).toHaveLength(1)
  })
})
