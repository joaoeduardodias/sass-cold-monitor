import { api } from "../api"

type TestNotificationEmailRequest = {
  org: string
  recipients: string[]
}

export async function testNotificationEmail({
  org,
  recipients,
}: TestNotificationEmailRequest) {
  return api
    .post(`organizations/${org}/notification-settings/test-email`, {
      json: {
        recipients,
      },
    })
    .json<{ sent: boolean }>()
}

