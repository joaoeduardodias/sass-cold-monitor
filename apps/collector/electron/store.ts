import Store from 'electron-store'

export type CollectorConfig = {
  sitradUrl: string
  username: string
  password: string
  stopPassword: string
  organizationId: string
  userId: string
  token: string
  setupToken: string
}

type AppStoreSchema = {
  config?: CollectorConfig
  isRunning: boolean
}

export const store = new Store<AppStoreSchema>()
