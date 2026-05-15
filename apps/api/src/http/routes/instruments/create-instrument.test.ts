import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { createInstrument } = await import('./create-instrument')

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

const basePayload = {
  name: 'Sensor 01',
  model: 1,
  maxValue: 10,
  minValue: -10,
  isActive: true,
  type: 'TEMPERATURE' as const,
  idSitrad: 42,
}

describe('POST /organizations/:slug/instrument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(createInstrument)
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/instrument',
      payload: basePayload,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 for viewer role', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    const app = await buildTestApp(createInstrument)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/instrument',
      headers: authHeaders(token),
      payload: basePayload,
    })
    expect(response.statusCode).toBe(401)
  })

  it('creates instrument for admin', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.instrument.create.mockResolvedValue({ id: uuid('inst') })
    const app = await buildTestApp(createInstrument)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/instrument',
      headers: authHeaders(token),
      payload: basePayload,
    })
    expect(response.statusCode).toBe(201)
    expect(response.json().instrumentId).toBe(uuid('inst'))
    expect(prismaMock.instrument.create).toHaveBeenCalledOnce()
  })
})
