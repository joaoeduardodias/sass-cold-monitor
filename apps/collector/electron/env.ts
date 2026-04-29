import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

function parseEnvValue(rawValue: string): string {
  const value = rawValue.trim()

  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return

  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex <= 0) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = parseEnvValue(trimmed.slice(separatorIndex + 1))

    if (!key) continue
    process.env[key] = value
  }
}

export function loadRuntimeEnv() {
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '.env.local'),
    path.join(path.dirname(process.execPath), '.env'),
    path.join(path.dirname(process.execPath), '.env.local'),
    path.join(process.resourcesPath, '.env'),
    path.join(process.resourcesPath, '.env.local'),
  ]

  for (const filePath of candidates) {
    loadEnvFile(filePath)
  }
}
