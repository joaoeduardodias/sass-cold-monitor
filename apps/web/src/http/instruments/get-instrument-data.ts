import { api } from "../api"

export type InstrumentDataPoint = {
  id: string
  data: number
  updatedUserAt: string | null
  createdAt: string
  updatedAt: string
}

interface GetInstrumentDataRequest {
  orgSlug: string
  instrumentSlug: string
  startDate: Date
  endDate: Date
  chartVariation: number
  tableVariation?: number
}

export interface GetInstrumentDataResponse {
  data: {
    id: string
    name: string
    dateOpen: string
    dateClose: string
    type: "JOIN" | "TEMPERATURE" | "PRESSURE"
    chartDataTemperature: InstrumentDataPoint[]
    chartDataPressure: InstrumentDataPoint[]
    tableDataTemperature: InstrumentDataPoint[]
    tableDataPressure: InstrumentDataPoint[]
  }
}

export async function getInstrumentData({
  orgSlug,
  instrumentSlug,
  startDate,
  endDate,
  chartVariation,
  tableVariation,
}: GetInstrumentDataRequest) {
  const result = await api
    .get(`organizations/${orgSlug}/instruments/${instrumentSlug}/data`, {
      searchParams: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        chartVariation,
        tableVariation,
      },
    })
    .json<GetInstrumentDataResponse>()

  return result
}
