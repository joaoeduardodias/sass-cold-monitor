import { api } from "../api"

interface UpdateInstrumentsRequest {
  org: string
  instruments: {
    id: string
    name: string
    model: number
    orderDisplay: number
    maxValue: number
    minValue: number
    isActive: boolean
    type: "TEMPERATURE" | "PRESSURE"
    idSitrad: number | null
  }[]
}

export async function updateInstruments({ org, instruments }: UpdateInstrumentsRequest) {
  await api.put(`organizations/${org}/instruments`, {
    json: { instruments },
  })
}
