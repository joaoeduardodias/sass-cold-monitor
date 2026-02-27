import { api } from "../api"

interface GetInstrumentsBySlugResponse {
  instrument: {
    id: string
    name: string
    slug: string
    model: number
    orderDisplay: number
    maxValue: number
    minValue: number
    isActive: boolean
    type: "TEMPERATURE" | "PRESSURE"
    idSitrad: number | null
    isFan?: boolean
    operationalStatus?: string
  }
}

interface GetInstrumentsBySlugRequest {
  orgSlug: string
  instrumentSlug: string
}

export async function getInstrumentsBySlug({
  orgSlug,
  instrumentSlug,
}: GetInstrumentsBySlugRequest) {
  const result = await api
    .get(`organizations/${orgSlug}/instruments/${instrumentSlug}`)
    .json<GetInstrumentsBySlugResponse>()

  return result
}
