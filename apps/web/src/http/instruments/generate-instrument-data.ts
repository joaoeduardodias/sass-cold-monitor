import { api } from "../api"

interface GenerateInstrumentDataRequest {
  orgSlug: string
  instrumentId: string
  startDate: Date
  endDate: Date
  defrostDate?: Date
  variation: number
  initialTemp?: number
  averageTemp?: number
}

interface GenerateInstrumentDataResponse {
  generatedData: Array<{
    instrumentId: string
    createdAt: string
    data: number
    editData: number
    generateData: number
    userEditData: string | null
  }>
}

export async function generateInstrumentData({
  orgSlug,
  instrumentId,
  startDate,
  endDate,
  defrostDate,
  variation,
  initialTemp,
  averageTemp,
}: GenerateInstrumentDataRequest) {
  return api
    .post(`organizations/${orgSlug}/instruments/${instrumentId}/generateData`, {
      json: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        defrostDate: defrostDate?.toISOString(),
        variation,
        initialTemp,
        averageTemp,
      },
    })
    .json<GenerateInstrumentDataResponse>()
}
