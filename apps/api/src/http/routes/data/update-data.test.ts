import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { updateData } = await import('./update-data')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

const payload = { data: [{ id: uuid('rec'), editData: 7.5 }] }

describe('PUT /organizations/:orgSlug/instrument/data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(updateData)
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme/instrument/data',
      payload,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 for viewer', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    const app = await buildTestApp(updateData)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme/instrument/data',
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 when record not found', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('EDITOR'))
    prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => Promise<unknown>) => {
      const tx = {
        ...prismaMock,
        instrumentData: {
          ...prismaMock.instrumentData,
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      }
      return cb(tx as typeof prismaMock)
    })
    const app = await buildTestApp(updateData)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme/instrument/data',
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(400)
  })

  it('updates data when editor', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('EDITOR'))
    prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => Promise<unknown>) => {
      const tx = {
        ...prismaMock,
        instrumentData: {
          ...prismaMock.instrumentData,
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      }
      return cb(tx as typeof prismaMock)
    })
    const app = await buildTestApp(updateData)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme/instrument/data',
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(204)
  })
})
