import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()
const agentMap = new Map<string, { readyState: number; OPEN: number; send: ReturnType<typeof vi.fn> }>()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/realtime/agent-connections', () => ({
  agentConnectionByOrg: agentMap,
}))

const { sendInstrumentCommand } = await import('./send-instrument-command')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

const route = `/organizations/acme/instruments/${uuid('inst')}/command`
const payload = { action: 'SET_DEFROST' as const, value: true }

describe('POST /organizations/:orgSlug/instruments/:instrumentId/command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    agentMap.clear()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(sendInstrumentCommand)
    const response = await app.inject({
      method: 'POST',
      url: route,
      payload,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 for viewer', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    const app = await buildTestApp(sendInstrumentCommand)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: route,
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 if instrument missing or wrong org', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.instrument.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(sendInstrumentCommand)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: route,
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(400)
  })

  it('returns 400 when no collector agent connected', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.instrument.findUnique.mockResolvedValue({
      id: uuid('inst'),
      idSitrad: 7,
      model: 1,
      organizationId: uuid('org'),
    })
    const app = await buildTestApp(sendInstrumentCommand)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: route,
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(400)
    expect(response.json().message).toMatch(/no active collector/i)
  })

  it('queues command when agent is connected', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.instrument.findUnique.mockResolvedValue({
      id: uuid('inst'),
      idSitrad: 7,
      model: 1,
      organizationId: uuid('org'),
    })
    const send = vi.fn()
    agentMap.set(uuid('org'), { readyState: 1, OPEN: 1, send })
    const app = await buildTestApp(sendInstrumentCommand)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: route,
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(202)
    expect(send).toHaveBeenCalledOnce()
    expect(response.json().status).toBe('queued')
  })
})
