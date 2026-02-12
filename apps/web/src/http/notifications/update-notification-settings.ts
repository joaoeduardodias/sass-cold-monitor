import { api } from "../api"

type UpdateNotificationSettingsRequest = {
  org: string
  emailEnabled: boolean
  emailRecipients: string[]
  pushEnabled: boolean
  criticalAlerts: boolean
  warningAlerts: boolean
  emailTemplate: string
}

export async function updateNotificationSettings({
  org,
  emailEnabled,
  emailRecipients,
  pushEnabled,
  criticalAlerts,
  warningAlerts,
  emailTemplate,
}: UpdateNotificationSettingsRequest) {
  await api.put(`organizations/${org}/notification-settings`, {
    json: {
      emailEnabled,
      emailRecipients,
      pushEnabled,
      criticalAlerts,
      warningAlerts,
      emailTemplate,
    },
  })
}
