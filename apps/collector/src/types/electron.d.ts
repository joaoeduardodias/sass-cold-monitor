export interface CollectorConfigView {
  sitradUrl: string
  username: string
  organizationId: string
  userId: string
  hasSavedPassword: boolean
  hasSavedSetupToken: boolean
  hasSavedStopPassword: boolean
  hasSavedDeviceToken: boolean
}

export interface CollectorConfigInput {
  sitradUrl?: string
  username?: string
  password?: string
  setupToken?: string
  stopPassword?: string
  organizationId?: string
  userId?: string
  token?: string
}

export interface ElectronAPI {
  getConfig(): Promise<Partial<CollectorConfigView> | undefined>
  getState(): Promise<boolean>
  saveConfig(cfg: CollectorConfigInput): Promise<void>
  start(): Promise<{ success: boolean; error?: string }>
  stopWithAuth(password: string): Promise<{ success: boolean; error?: string }>
  onStopAuthRequested(callback: () => void): () => void
  onCollectorRuntimeEvent(
    callback: (event: {
      status: 'running' | 'stopped' | 'error'
      message: string
      code?: 'AGENT_ALREADY_RUNNING'
    }) => void,
  ): () => void
  testSitrad(cfg: CollectorConfigInput): Promise<{ success: boolean; error?: string }>
  minimizeWindow(): Promise<void>
  toggleMaximizeWindow(): Promise<void>
  closeWindow(): Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
