import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadRuntimeEnv } from './env'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

loadRuntimeEnv()

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV = process.env['VITE_DEV_SERVER_URL']
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development' || Boolean(VITE_DEV)
const DEFAULT_SYSTEM_API_BASE_URL = IS_DEVELOPMENT
  ? 'http://localhost:3333'
  : 'https://api-cold-monitor.onrender.com'
const DEFAULT_WS_URL = IS_DEVELOPMENT
  ? 'ws://localhost:3333/ws/agent'
  : 'wss://api-cold-monitor.onrender.com/ws/agent'

export const SYSTEM_API_BASE_URL =
  process.env.COLLECTOR_API_BASE_URL?.trim() || DEFAULT_SYSTEM_API_BASE_URL
export const WS_URL = process.env.COLLECTOR_WS_URL?.trim() || DEFAULT_WS_URL
export const DEVICE_AUTH_ENDPOINT = '/devices/auth/login'
