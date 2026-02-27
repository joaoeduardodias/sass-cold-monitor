import { api } from "../api"

type GetAlertReadSignaturesResponse = {
  readSignatures: Array<{
    instrumentId: string
    signature: string
    readAt: string
  }>
}

export async function getAlertReadSignatures(org: string) {
  return api
    .get(`organizations/${org}/alerts/read-signatures`)
    .json<GetAlertReadSignaturesResponse>()
}
