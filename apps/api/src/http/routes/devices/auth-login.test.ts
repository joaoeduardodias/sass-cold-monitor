import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { devicesAuthLoginRoute } = await import('./auth-login')

describe('POST /devices/auth/bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(devicesAuthLoginRoute)
    const response = await app.inject({
      method: 'POST',
      url: '/devices/auth/bootstrap',
      payload: { organizationId: uuid('org') },
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 if organization not found', async () => {
    prismaMock.organization.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(devicesAuthLoginRoute)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/devices/auth/bootstrap',
      headers: authHeaders(token),
      payload: { organizationId: uuid('org') },
    })
    expect(response.statusCode).toBe(400)
  })

  it('returns 401 if user is not a member', async () => {
    prismaMock.organization.findUnique.mockResolvedValue({ id: uuid('org') })
    prismaMock.member.findFirst.mockResolvedValue(null)
    const app = await buildTestApp(devicesAuthLoginRoute)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/devices/auth/bootstrap',
      headers: authHeaders(token),
      payload: { organizationId: uuid('org') },
    })
    expect(response.statusCode).toBe(401)
  })

  it('issues a setup token and stop password', async () => {
    prismaMock.organization.findUnique.mockResolvedValue({ id: uuid('org') })
    prismaMock.member.findFirst.mockResolvedValue({ id: uuid('memb') })
    prismaMock.collectorDevice.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.collectorDevice.create.mockResolvedValue({ id: uuid('dev') })
    const app = await buildTestApp(devicesAuthLoginRoute)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/devices/auth/bootstrap',
      headers: authHeaders(token),
      payload: { organizationId: uuid('org') },
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().setupToken).toEqual(expect.any(String))
    expect(response.json().stopPassword).toEqual(expect.any(String))
  })
})

describe('GET /devices/auth/latest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(devicesAuthLoginRoute)
    const response = await app.inject({
      method: 'GET',
      url: `/devices/auth/latest?organizationId=${uuid('org')}`,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns null when nothing stored', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: uuid('memb') })
    prismaMock.collectorDevice.findFirst.mockResolvedValue(null)
    const app = await buildTestApp(devicesAuthLoginRoute)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: `/devices/auth/latest?organizationId=${uuid('org')}`,
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().latest).toBeNull()
  })

  it('returns latest device token info', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: uuid('memb') })
    prismaMock.collectorDevice.findFirst.mockResolvedValue({
      token: 'token-1',
      setupToken: 'setup-1',
      stopPassword: 'pwd',
      createdAt: new Date(),
    })
    const app = await buildTestApp(devicesAuthLoginRoute)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: `/devices/auth/latest?organizationId=${uuid('org')}`,
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().latest.stopPassword).toBe('pwd')
  })
})

describe('POST /devices/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for malformed setup token', async () => {
    const app = await buildTestApp(devicesAuthLoginRoute)
    const response = await app.inject({
      method: 'POST',
      url: '/devices/auth/login',
      payload: { setupToken: 'not-a-jwt' },
    })
    expect(response.statusCode).toBe(401)
  })

  it('exchanges valid setup token for a device token', async () => {
    const app = await buildTestApp(devicesAuthLoginRoute)
    const setupToken = app.jwt.sign({
      sub: uuid('user'),
      organizationId: uuid('org'),
      scope: 'collector_setup',
    })

    prismaMock.organization.findUnique.mockResolvedValue({ id: uuid('org') })
    prismaMock.member.findFirst.mockResolvedValue({ id: uuid('memb') })
    prismaMock.collectorDevice.findFirst.mockResolvedValue({
      id: uuid('dev'),
      setupToken,
      stopPassword: 'stop-pwd',
    })
    prismaMock.collectorDevice.update.mockResolvedValue({})

    const response = await app.inject({
      method: 'POST',
      url: '/devices/auth/login',
      payload: { setupToken },
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().token).toEqual(expect.any(String))
    expect(response.json().stopPassword).toBe('stop-pwd')
  })

  it('returns 401 when collector device is missing or stopPassword absent', async () => {
    const app = await buildTestApp(devicesAuthLoginRoute)
    const setupToken = app.jwt.sign({
      sub: uuid('user'),
      organizationId: uuid('org'),
      scope: 'collector_setup',
    })

    prismaMock.organization.findUnique.mockResolvedValue({ id: uuid('org') })
    prismaMock.member.findFirst.mockResolvedValue({ id: uuid('memb') })
    prismaMock.collectorDevice.findFirst.mockResolvedValue(null)

    const response = await app.inject({
      method: 'POST',
      url: '/devices/auth/login',
      payload: { setupToken },
    })
    expect(response.statusCode).toBe(401)
  })
})
