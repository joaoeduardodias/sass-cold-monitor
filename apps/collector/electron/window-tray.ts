import { app, BrowserWindow, Menu, Tray, nativeImage, shell } from 'electron'
import path from 'node:path'
import { MAIN_DIST, RENDERER_DIST, VITE_DEV } from './constants'

let win: BrowserWindow | null = null
let tray: Tray | null = null

let startCollectorHandler: (() => void) | null = null
let stopCollectorHandler: (() => void) | null = null

function getAppIconPath() {
  return process.env.NODE_ENV === 'development'
    ? path.join(process.cwd(), 'public', 'LOGO.png')
    : path.join(process.resourcesPath, 'public', 'LOGO.png')
}

export function configureTrayActions(actions: { start: () => void; stop: () => void }) {
  startCollectorHandler = actions.start
  stopCollectorHandler = actions.stop
}

export function requestStopAuthFromRenderer() {
  if (!win) createWindow()
  if (!win) return

  win.show()
  win.focus()

  if (win.webContents.isLoadingMainFrame()) {
    win.webContents.once('did-finish-load', () => {
      win?.webContents.send('request-stop-auth')
    })
    return
  }

  win.webContents.send('request-stop-auth')
}

export function setTray(running: boolean) {
  tray?.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Configuração',
      click: () => {
        if (!win) createWindow()
        else win.show()
      }
    },
    {
      label: running ? 'Parar envio' : 'Iniciar envio',
      click: () => {
        if (running) stopCollectorHandler?.()
        else startCollectorHandler?.()
      }
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => app.quit()
    }
  ]))
}

export function createWindow() {
  win = new BrowserWindow({
    width: 600,
    height: 700,
    center: true,
    minWidth: 520,
    minHeight: 560,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    roundedCorners: true,
    icon: getAppIconPath(),
    webPreferences: {
      preload: path.join(MAIN_DIST, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false,
    }
  })

  if (VITE_DEV) win.loadURL(VITE_DEV)
  else win.loadFile(path.join(RENDERER_DIST, 'index.html'))

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    const currentUrl = win?.webContents.getURL()
    if (currentUrl && url !== currentUrl) {
      event.preventDefault()
    }
  })

  win.once('ready-to-show', () => {
    win?.center()
  })

  win.on('close', (e) => {
    e.preventDefault()
    if (win) win.hide()
  })
}

export function createTray() {
  const trayImagePath = getAppIconPath()

  const trayIcon = nativeImage.createFromPath(trayImagePath)
  tray = new Tray(trayIcon)
}
