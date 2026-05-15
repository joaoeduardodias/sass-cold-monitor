import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { deleteInstrument } = await import('./delete-instrument')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: {
      id: uuid('org'),
      name: 'Acme',
      slug: 'acme',
      domain: null,
      shouldAttachUsersByDomain: false,
      avatarUrl: null,
      ownerId: uuid('user'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }
}

describe('DELETE /organizations/:orgSlug/instruments/:instrumentSlug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(deleteInstrument)
    const response = await app.inject({
      method: 'DELETE',
      url: '/organizations/acme/instruments/sensor',
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 if instrument not found', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.instrument.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(deleteInstrument)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'DELETE',
      url: '/organizations/acme/instruments/sensor',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(400)
  })

  it('returns 401 when viewer tries to delete', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    prismaMock.instrument.findUnique.mockResolvedValue({
      __typename: 'Instrument',
      id: uuid('inst'),
      organization_id: uuid('org'),
      organizationId: uuid('org'),
    })
    const app = await buildTestApp(deleteInstrument)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'DELETE',
      url: '/organizations/acme/instruments/sensor',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(401)
  })

  it('deletes instrument', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.instrument.findUnique.mockResolvedValue({
      __typename: 'Instrument',
      id: uuid('inst'),
      organization_id: uuid('org'),
      organizationId: uuid('org'),
    })
    prismaMock.instrument.delete.mockResolvedValue({})
    const app = await buildTestApp(deleteInstrument)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'DELETE',
      url: '/organizations/acme/instruments/sensor',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(204)
  })
})
