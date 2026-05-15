import axios from 'axios'
import { app, BrowserWindow, ipcMain } from 'electron'
import log from 'electron-log'
import https from 'https'
import path from 'node:path'
import WebSocket from 'ws'
import { startAppCollector, stopCollector, type CollectorRuntimeEvent, setCollectorRuntimeEventHandler } from './collector-service'
import { WS_URL } from './constants'
import { getCollectorConfig, getRendererConfig, setCollectorConfig } from './config-store'
import { hydrateAuthFromDeviceConfig, readExternalDeviceConfig } from './device-auth'
import { store } from './store'
import { configureTrayActions, createTray, createWindow, requestStopAuthFromRenderer, setTray } from './window-tray'

process.on('uncaughtException', (err) => {
  log?.error?.('uncaughtException:', err)
})

process.on('unhandledRejection', (reason) => {
  log?.error?.('unhandledRejection:', reason)
})

app.disableHardwareAcceleration()

const agent = new https.Agent({ rejectUnauthorized: false })

function broadcastCollectorEvent(event: CollectorRuntimeEvent) {
  const windows = BrowserWindow.getAllWindows()
  windows.forEach((window) => {
    if (!window.isDestroyed()) {
      window.webContents.send('collector-runtime-event', event)
    }
  })
}

setCollectorRuntimeEventHandler(broadcastCollectorEvent)

function testBackendWebSocketConnection(timeout = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    let ws: WebSocket | null = null
    let completed = false

    const timer = setTimeout(() => {
      if (completed) return
      completed = true
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.terminate()
      }
      reject(new Error('timeout'))
    }, timeout)

    const finishWithError = (err: Error) => {
      if (completed) return
      completed = true
      clearTimeout(timer)
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.terminate()
      }
      reject(err)
    }

    ws = new WebSocket(WS_URL)

    ws.once('open', () => {
      if (completed) return
      completed = true
      clearTimeout(timer)
      ws?.close()
      resolve()
    })

    ws.once('error', (err) => {
      finishWithError(err instanceof Error ? err : new Error(String(err)))
    })
  })
}

configureTrayActions({
  start: () => {
    void startAppCollector()
  },
  stop: () => {
    requestStopAuthFromRenderer()
  },
})

ipcMain.handle('get-config', () => getRendererConfig())
ipcMain.handle('get-state', () => store.get('isRunning'))
ipcMain.handle('save-config', (_e, cfg) => {
  const setupToken = typeof cfg?.setupToken === 'string' && cfg.setupToken.length > 0
    ? cfg.setupToken
    : undefined

  setCollectorConfig({
    sitradUrl: typeof cfg?.sitradUrl === 'string' ? cfg.sitradUrl : undefined,
    username: typeof cfg?.username === 'string' ? cfg.username : undefined,
    password: typeof cfg?.password === 'string' && cfg.password.length > 0 ? cfg.password : undefined,
    stopPassword: typeof cfg?.stopPassword === 'string' && cfg.stopPassword.length > 0 ? cfg.stopPassword : undefined,
    organizationId: setupToken ? '' : typeof cfg?.organizationId === 'string' ? cfg.organizationId : undefined,
    userId: setupToken ? '' : typeof cfg?.userId === 'string' ? cfg.userId : undefined,
    token: setupToken ? '' : typeof cfg?.token === 'string' && cfg.token.length > 0 ? cfg.token : undefined,
    setupToken,
  })
})
ipcMain.handle('start', async () => startAppCollector())
ipcMain.handle('stop-with-auth', async (_e, password: string) => {
  const informedPassword = typeof password === 'string' ? password.trim() : ''
  const storedPassword = getCollectorConfig()?.stopPassword?.trim()
  const externalPassword = readExternalDeviceConfig()?.stopPassword?.trim()
  const savedPassword = storedPassword || externalPassword

  if (!savedPassword) {
    return { success: false, error: 'Senha de parada não configurada para validação.' }
  }

  if (!informedPassword || informedPassword !== savedPassword) {
    log.warn('Stop denied: invalid stop authentication password')
    return { success: false, error: 'Senha inválida.' }
  }

  stopCollector()
  return { success: true }
})
ipcMain.handle('window-minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize()
})
ipcMain.handle('window-toggle-maximize', (event) => {
  const target = BrowserWindow.fromWebContents(event.sender)
  if (!target) return
  if (target.isMaximized()) target.unmaximize()
  else target.maximize()
})
ipcMain.handle('window-close', (event) => {
  const target = BrowserWindow.fromWebContents(event.sender)
  if (!target) return
  target.removeAllListeners('close')
  target.close()
})

ipcMain.handle('test-sitrad-api', async (_e, config) => {
  try {
    setCollectorConfig({
      sitradUrl: typeof config?.sitradUrl === 'string' ? config.sitradUrl : undefined,
      username: typeof config?.username === 'string' ? config.username : undefined,
      password: typeof config?.password === 'string' && config.password.length > 0 ? config.password : undefined,
      stopPassword: typeof config?.stopPassword === 'string' && config.stopPassword.length > 0 ? config.stopPassword : undefined,
      setupToken: typeof config?.setupToken === 'string' && config.setupToken.length > 0 ? config.setupToken : undefined,
      organizationId: typeof config?.organizationId === 'string' ? config.organizationId : undefined,
      userId: typeof config?.userId === 'string' ? config.userId : undefined,
      token: typeof config?.token === 'string' && config.token.length > 0 ? config.token : undefined,
    })

    const mergedConfig = getCollectorConfig()
    if (!mergedConfig?.sitradUrl || !mergedConfig.username || !mergedConfig.password) {
      return { success: false, error: 'Configuracao incompleta para testar a conexao.' }
    }

    const base = mergedConfig.sitradUrl.replace(/\/+$/, '')
    const r = await axios.get(`${base}/instruments`, {
      auth: { username: mergedConfig.username, password: mergedConfig.password },
      httpsAgent: agent,
      timeout: 3000,
      validateStatus: () => true,
      headers: {
        Accept: 'application/json'
      }
    })

    if (r.status !== 200) {
      return { success: false, error: 'Erro na API' }
    }

    try {
      await testBackendWebSocketConnection(3000)
    } catch (err: any) {
      return { success: false, error: `Erro ao conectar no App - ${err.message}` }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: `Erro ao conectar na API - ${err.message}` }
  }
})

app.setLoginItemSettings({
  openAtLogin: true,
  path: process.execPath
})

app.whenReady().then(async () => {
  const appIconPath =
    process.env.NODE_ENV === 'development'
      ? path.join(process.cwd(), 'public', 'LOGO.png')
      : path.join(process.resourcesPath, 'public', 'LOGO.png')

  if (process.platform === 'darwin') {
    app.dock.setIcon(appIconPath)
  }

  await hydrateAuthFromDeviceConfig()

  createTray()
  createWindow()

  const config = getCollectorConfig()
  const running = !!store.get('isRunning')

  if (running && config) void startAppCollector()

  setTray(running)
})

app.on('window-all-closed', (e: Electron.Event) => e.preventDefault())
