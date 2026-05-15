import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { updateInstrument } = await import('./update-instrument')

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

const item = {
  id: uuid('inst'),
  name: 'Sensor',
  model: 1,
  orderDisplay: 1,
  maxValue: 10,
  minValue: -10,
  isActive: true,
  type: 'TEMPERATURE' as const,
  idSitrad: 7,
}

describe('PUT /organizations/:orgSlug/instruments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(updateInstrument)
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme/instruments',
      payload: { instruments: [item] },
    })
    expect(response.statusCode).toBe(401)
  })

  it('updates instruments via transaction', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => Promise<unknown>) => {
      const tx = {
        ...prismaMock,
        instrument: {
          ...prismaMock.instrument,
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      }
      return cb(tx as typeof prismaMock)
    })
    const app = await buildTestApp(updateInstrument)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme/instruments',
      headers: authHeaders(token),
      payload: { instruments: [item] },
    })
    expect(response.statusCode).toBe(204)
  })

  it('returns 400 when no rows updated', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => Promise<unknown>) => {
      const tx = {
        ...prismaMock,
        instrument: {
          ...prismaMock.instrument,
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      }
      return cb(tx as typeof prismaMock)
    })
    const app = await buildTestApp(updateInstrument)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme/instruments',
      headers: authHeaders(token),
      payload: { instruments: [item] },
    })
    expect(response.statusCode).toBe(400)
  })
})
