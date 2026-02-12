import { api } from "../api"

export type NotificationSettingsResponse = {
  settings: {
    emailEnabled: boolean
    emailRecipients: string[]
    pushEnabled: boolean
    criticalAlerts: boolean
    warningAlerts: boolean
    emailTemplate: string
  }
}

export async function getNotificationSettings(org: string) {
  return api
    .get(`organizations/${org}/notification-settings`)
    .json<NotificationSettingsResponse>()
}
