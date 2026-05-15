import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { deleteJoinInstrument } = await import('./delete-join-instrument')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

describe('DELETE /organizations/:orgSlug/joinInstruments/:joinInstrumentId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(deleteJoinInstrument)
    const response = await app.inject({
      method: 'DELETE',
      url: `/organizations/acme/joinInstruments/${uuid('join')}`,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 when join instrument not found', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.joinInstrument.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(deleteJoinInstrument)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'DELETE',
      url: `/organizations/acme/joinInstruments/${uuid('join')}`,
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(400)
  })

  it('deletes join instrument when admin', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.joinInstrument.findUnique.mockResolvedValue({
      firstInstrument: {
        __typename: 'Instrument',
        id: uuid('inst1'),
        organization_id: uuid('org'),
        name: 'A',
      },
      secondInstrument: {
        __typename: 'Instrument',
        id: uuid('inst2'),
        organization_id: uuid('org'),
        name: 'B',
      },
    })
    prismaMock.joinInstrument.delete.mockResolvedValue({})
    const app = await buildTestApp(deleteJoinInstrument)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'DELETE',
      url: `/organizations/acme/joinInstruments/${uuid('join')}`,
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(204)
  })
})
