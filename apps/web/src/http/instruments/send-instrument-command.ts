import { api } from "../api"

type InstrumentCommandRequest =
  | {
    orgSlug: string
    instrumentId: string
    action: "SET_DEFROST" | "SET_FAN"
    value: boolean
  }
  | {
    orgSlug: string
    instrumentId: string
    action: "SET_SETPOINT" | "SET_DIFFERENTIAL"
    value: number
  }

export async function sendInstrumentCommand({
  orgSlug,
  instrumentId,
  action,
  value,
}: InstrumentCommandRequest) {
  await api.post(`organizations/${orgSlug}/instruments/${instrumentId}/command`, {
    json: {
      action,
      value,
    },
  })
}
