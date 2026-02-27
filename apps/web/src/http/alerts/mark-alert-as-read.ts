import { api } from "../api"

type MarkAlertAsReadRequest = {
  org: string
  instrumentId: string
  signature: string
  severity: "warning" | "critical"
  value: number
  minThreshold: number
  maxThreshold: number
  thresholdType: "min" | "max"
  alertTimestamp: string
}

export async function markAlertAsRead({
  org,
  instrumentId,
  signature,
  severity,
  value,
  minThreshold,
  maxThreshold,
  thresholdType,
  alertTimestamp,
}: MarkAlertAsReadRequest) {
  await api.post(`organizations/${org}/alerts/read`, {
    json: {
      instrumentId,
      signature,
      severity,
      value,
      minThreshold,
      maxThreshold,
      thresholdType,
      alertTimestamp,
    },
  })
}
