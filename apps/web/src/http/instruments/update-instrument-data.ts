import { api } from "../api"

interface UpdateInstrumentDataRequest {
  orgSlug: string
  data: Array<{
    id: string
    editData: number
  }>
}

export async function updateInstrumentData({
  orgSlug,
  data,
}: UpdateInstrumentDataRequest) {
  await api.put(`organizations/${orgSlug}/instrument/data`, {
    json: { data },
  })
}
