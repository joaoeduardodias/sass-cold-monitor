import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()
const generateInstrumentDataMock = vi.fn()
const saveInstrumentDataMock = vi.fn()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/utils/generate-data', () => ({
  generateInstrumentData: generateInstrumentDataMock,
  saveInstrumentData: saveInstrumentDataMock,
}))

const { generateData } = await import('./generate-data')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

const route = `/organizations/acme/instruments/${uuid('inst')}/generateData`
const payload = {
  startDate: '2026-01-01',
  endDate: '2026-01-02',
  variation: 0.5,
}

describe('POST /organizations/:orgSlug/instruments/:instrumentId/generateData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(generateData)
    const response = await app.inject({
      method: 'POST',
      url: route,
      payload,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 for viewer', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    const app = await buildTestApp(generateData)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: route,
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 when instrument not found', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.instrument.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(generateData)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: route,
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(400)
  })

  it('returns 400 when startDate >= endDate', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.instrument.findUnique.mockResolvedValue({
      id: uuid('inst'),
      type: 'TEMPERATURE',
    })
    const app = await buildTestApp(generateData)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: route,
      headers: authHeaders(token),
      payload: { startDate: '2026-01-02', endDate: '2026-01-01', variation: 0.5 },
    })
    expect(response.statusCode).toBe(400)
  })

  it('generates and saves data for admin', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.instrument.findUnique.mockResolvedValue({
      id: uuid('inst'),
      type: 'TEMPERATURE',
    })
    const generated = [
      {
        instrumentId: uuid('inst'),
        createdAt: new Date(),
        data: 5,
        editData: 5,
        generateData: 1,
        userEditData: null,
      },
    ]
    generateInstrumentDataMock.mockReturnValue(generated)
    saveInstrumentDataMock.mockResolvedValue(undefined)
    const app = await buildTestApp(generateData)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: route,
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(201)
    expect(saveInstrumentDataMock).toHaveBeenCalledOnce()
  })
})
