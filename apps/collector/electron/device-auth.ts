import axios from 'axios'
import { app } from 'electron'
import log from 'electron-log'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { getCollectorConfig, setCollectorConfig } from './config-store'
import { DEVICE_AUTH_ENDPOINT, SYSTEM_API_BASE_URL } from './constants'

export type ExternalDeviceConfig = {
  setupToken?: string
  organizationId?: string
  userId?: string
  token?: string
  stopPassword?: string
}

function normalizeTokenValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function normalizeOrganizationIdValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function normalizeExternalDeviceConfig(raw: Record<string, unknown>): ExternalDeviceConfig {
  const setupToken = normalizeTokenValue(raw.setupToken)
  const token = normalizeTokenValue(raw.token ?? raw.deviceToken ?? raw.device_token)
  const organizationId = normalizeOrganizationIdValue(
    raw.organizationId
    ?? raw.organization_id
    ?? raw.orgId
    ?? (typeof raw.organization === 'object' && raw.organization ? (raw.organization as Record<string, unknown>).id : undefined),
  )
  const userId = normalizeOrganizationIdValue(
    raw.userId
    ?? raw.user_id
    ?? (typeof raw.user === 'object' && raw.user ? (raw.user as Record<string, unknown>).id : undefined),
  )
  const stopPassword =
    typeof raw.stopPassword === 'string' && raw.stopPassword.trim().length > 0
      ? raw.stopPassword.trim()
      : undefined

  return {
    setupToken,
    token,
    organizationId,
    userId,
    stopPassword,
  }
}

export function readExternalDeviceConfig(): ExternalDeviceConfig | null {
  const candidates = [
    path.join(app.getPath('userData'), 'config.json'),
    path.join(path.dirname(process.execPath), 'config.json'),
    path.join(process.resourcesPath, 'config.json'),
    path.join(process.resourcesPath, '..', 'config.json'),
    path.join(process.cwd(), 'config.json'),
  ]

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue

    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, unknown>
      const normalized = normalizeExternalDeviceConfig(parsed)

      if (!normalized.setupToken && !normalized.token && !normalized.organizationId && !normalized.userId && !normalized.stopPassword) {
        log.warn(`Ignoring invalid config.json at ${filePath}: expected setupToken, token, organizationId, userId or stopPassword`)
        continue
      }

      return normalized
    } catch (err) {
      log.error(`Failed to read config.json at ${filePath}:`, err)
    }
  }

  return null
}

export async function loginWithSetupToken(
  payload: { setupToken: string },
): Promise<{ token: string, organizationId: string, stopPassword?: string } | null> {
  const url = `${SYSTEM_API_BASE_URL}${DEVICE_AUTH_ENDPOINT}`
  try {
    const response = await axios.post(
      url,
      { setupToken: payload.setupToken },
      {
        timeout: 8000,
        validateStatus: () => true,
        headers: { Accept: 'application/json' },
      },
    )
    if (response.status < 200 || response.status >= 300) {
      log.warn('Setup token login rejected', {
        url,
        status: response.status,
        body: response.data,
      })
      return null
    }

    const data = response.data as Record<string, unknown> | undefined
    const token = normalizeTokenValue(data?.token ?? data?.deviceToken ?? data?.device_token)
    const organizationId = normalizeOrganizationIdValue(
      data?.organizationId
      ?? data?.organization_id
      ?? data?.orgId
      ?? (typeof data?.organization === 'object' && data.organization ? (data.organization as Record<string, unknown>).id : undefined),
    )
    const stopPassword = typeof data?.stopPassword === 'string' ? data.stopPassword.trim() : undefined
    if (
      typeof token === 'string' &&
      token.length > 0 &&
      typeof organizationId === 'string' &&
      organizationId.length > 0
    ) {
      return { token, organizationId, stopPassword }
    }
  } catch (err) {
    log.error('Setup token login request failed', { url, err })
  }

  return null
}

export async function hydrateAuthFromDeviceConfig() {
  const external = readExternalDeviceConfig()
  const current = getCollectorConfig()
  const persisted = {
    sitradUrl: current?.sitradUrl ?? '',
    username: current?.username ?? '',
    password: current?.password ?? '',
    stopPassword: current?.stopPassword ?? '',
    organizationId: current?.organizationId ?? '',
    userId: current?.userId ?? '',
    token: current?.token ?? '',
    setupToken: current?.setupToken ?? '',
  }

  const nextToken = external?.token ?? persisted.token
  const nextSetupToken = external?.setupToken ?? persisted.setupToken
  const authInputChanged =
    (typeof external?.token === 'string' && external.token.trim() !== persisted.token.trim())
    || (typeof external?.setupToken === 'string' && external.setupToken.trim() !== persisted.setupToken.trim())
  const shouldPreferSetupToken = Boolean((external?.setupToken ?? persisted.setupToken).trim())

  setCollectorConfig({
    ...persisted,
    token: shouldPreferSetupToken ? '' : authInputChanged && !external?.token ? '' : nextToken,
    setupToken: nextSetupToken,
    organizationId: external?.organizationId ?? (authInputChanged ? '' : persisted.organizationId),
    userId: external?.userId ?? (authInputChanged ? '' : persisted.userId),
    stopPassword: external?.stopPassword ?? persisted.stopPassword,
  })
}

export async function resolveCollectorConfig() {
  await hydrateAuthFromDeviceConfig()
  const config = getCollectorConfig()
  if (!config) return config

  const setupToken = config.setupToken?.trim()
  if (!setupToken) {
    return config
  }

  log.info('Authenticating device with setup token before collector start', {
    hasPersistedToken: Boolean(config.token?.trim()),
    hasSetupToken: Boolean(setupToken),
  })

  const authenticatedDevice = await loginWithSetupToken({
    setupToken,
  })

  if (!authenticatedDevice) {
    log.warn('Setup token authentication did not return a device token')
    return getCollectorConfig()
  }

  const nextConfig = {
    ...config,
    token: authenticatedDevice.token,
    setupToken: '',
    organizationId: authenticatedDevice.organizationId,
    stopPassword: authenticatedDevice.stopPassword ?? config.stopPassword,
  }

  setCollectorConfig(nextConfig)
  return nextConfig
}
