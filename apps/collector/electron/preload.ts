import { contextBridge, ipcRenderer } from 'electron'

interface Config {
  [key: string]: unknown
}

interface ElectronAPI {
  getConfig: () => Promise<Config>
  getState: () => Promise<boolean>
  saveConfig: (cfg: Config) => Promise<void>
  start: () => Promise<{ success: boolean; error?: string }>
  stopWithAuth: (password: string) => Promise<{ success: boolean; error?: string }>
  onStopAuthRequested: (callback: () => void) => () => void
  onCollectorRuntimeEvent: (
    callback: (event: {
      status: 'running' | 'stopped' | 'error'
      message: string
      code?: 'AGENT_ALREADY_RUNNING'
    }) => void,
  ) => () => void
  testSitrad: (cfg: Config) => Promise<{ success: boolean, error?: string }>
  minimizeWindow: () => Promise<void>
  toggleMaximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
}

const api: ElectronAPI = {
  getConfig: () => ipcRenderer.invoke('get-config'),
  getState: () => ipcRenderer.invoke('get-state'),
  saveConfig: (cfg) => ipcRenderer.invoke('save-config', cfg),
  start: () => ipcRenderer.invoke('start'),
  stopWithAuth: (password) => ipcRenderer.invoke('stop-with-auth', password),
  onStopAuthRequested: (callback) => {
    const listener = () => callback()
    ipcRenderer.on('request-stop-auth', listener)
    return () => ipcRenderer.off('request-stop-auth', listener)
  },
  onCollectorRuntimeEvent: (callback) => {
    const listener = (_event: unknown, payload: {
      status: 'running' | 'stopped' | 'error'
      message: string
      code?: 'AGENT_ALREADY_RUNNING'
    }) => {
      callback(payload)
    }
    ipcRenderer.on('collector-runtime-event', listener)
    return () => ipcRenderer.off('collector-runtime-event', listener)
  },
  testSitrad: (cfg) => ipcRenderer.invoke('test-sitrad-api', cfg),
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window-toggle-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
}

contextBridge.exposeInMainWorld('electronAPI', api)
