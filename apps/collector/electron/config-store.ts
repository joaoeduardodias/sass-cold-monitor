import { safeStorage } from 'electron'
import { store, type CollectorConfig } from './store'

const ENCRYPTED_PREFIX = 'enc:'
const PLAIN_PREFIX = 'plain:'

type SensitiveField = 'password' | 'stopPassword' | 'token' | 'setupToken'

const SENSITIVE_FIELDS: SensitiveField[] = ['password', 'stopPassword', 'token', 'setupToken']

export type RendererCollectorConfig = {
  sitradUrl: string
  username: string
  organizationId: string
  userId: string
  hasSavedPassword: boolean
  hasSavedSetupToken: boolean
  hasSavedStopPassword: boolean
  hasSavedDeviceToken: boolean
}

function encryptSecret(value: string): string {
  if (!value) return ''

  try {
    if (safeStorage.isEncryptionAvailable()) {
      return `${ENCRYPTED_PREFIX}${safeStorage.encryptString(value).toString('base64')}`
    }
  } catch {
    // Fall back to tagged plaintext if OS encryption is unavailable.
  }

  return `${PLAIN_PREFIX}${value}`
}

function decryptSecret(value: string): string {
  if (!value) return ''

  if (value.startsWith(ENCRYPTED_PREFIX)) {
    const payload = value.slice(ENCRYPTED_PREFIX.length)

    try {
      return safeStorage.decryptString(Buffer.from(payload, 'base64'))
    } catch {
      return ''
    }
  }

  if (value.startsWith(PLAIN_PREFIX)) {
    return value.slice(PLAIN_PREFIX.length)
  }

  return value
}

function normalizeConfig(config?: Partial<CollectorConfig>): CollectorConfig | undefined {
  if (!config) return undefined

  const normalized = { ...config } as CollectorConfig

  for (const field of SENSITIVE_FIELDS) {
    normalized[field] = decryptSecret(normalized[field] ?? '')
  }

  normalized.sitradUrl = normalized.sitradUrl ?? ''
  normalized.username = normalized.username ?? ''
  normalized.organizationId = normalized.organizationId ?? ''
  normalized.userId = normalized.userId ?? ''

  return normalized
}

export function getCollectorConfig(): CollectorConfig | undefined {
  return normalizeConfig(store.get('config'))
}

export function getRendererConfig(): RendererCollectorConfig | undefined {
  const config = getCollectorConfig()
  if (!config) return undefined

  return {
    sitradUrl: config.sitradUrl,
    username: config.username,
    organizationId: config.organizationId,
    userId: config.userId,
    hasSavedPassword: Boolean(config.password),
    hasSavedSetupToken: Boolean(config.setupToken),
    hasSavedStopPassword: Boolean(config.stopPassword),
    hasSavedDeviceToken: Boolean(config.token),
  }
}

export function setCollectorConfig(config: Partial<CollectorConfig>): void {
  const rawStored = (store.get('config') ?? {}) as Partial<CollectorConfig>
  const current = getCollectorConfig()

  const next: CollectorConfig = {
    sitradUrl: config.sitradUrl ?? current?.sitradUrl ?? '',
    username: config.username ?? current?.username ?? '',
    password: config.password ?? current?.password ?? '',
    stopPassword: config.stopPassword ?? current?.stopPassword ?? '',
    organizationId: config.organizationId ?? current?.organizationId ?? '',
    userId: config.userId ?? current?.userId ?? '',
    token: config.token ?? current?.token ?? '',
    setupToken: config.setupToken ?? current?.setupToken ?? '',
  }

  // For sensitive fields, preserve the raw encrypted value when the field was not
  // explicitly provided — avoids overwriting a valid encrypted value with '' when
  // OS-level decryption fails silently (e.g. after a reinstall/key rotation).
  const encoded: CollectorConfig = {
    sitradUrl: next.sitradUrl,
    username: next.username,
    organizationId: next.organizationId,
    userId: next.userId,
    password: config.password !== undefined ? encryptSecret(next.password) : (rawStored.password ?? ''),
    stopPassword: config.stopPassword !== undefined ? encryptSecret(next.stopPassword) : (rawStored.stopPassword ?? ''),
    token: config.token !== undefined ? encryptSecret(next.token) : (rawStored.token ?? ''),
    setupToken: config.setupToken !== undefined ? encryptSecret(next.setupToken) : (rawStored.setupToken ?? ''),
  }

  store.set('config', encoded)
}

export function clearSensitiveCollectorField(field: SensitiveField): void {
  const current = getCollectorConfig()
  if (!current) return

  setCollectorConfig({
    ...current,
    [field]: '',
  })
}
