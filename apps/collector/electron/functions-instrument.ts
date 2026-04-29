import axios from "axios"
import https from 'https'
import type { IResult, InstrumentSnapshot, SitradInstrument, SitradValuesResponse } from "./types"

const agent = new https.Agent({ rejectUnauthorized: false })


export async function getInstruments(config: any) {
  const base = config.sitradUrl.replace(/\/+$/, '')
  const r = await axios.get(`${base}/instruments`, {
    auth: { username: config.username, password: config.password },
    httpsAgent: agent
  })

  return (r.data.results || []) as SitradInstrument[]
}

async function getValues(id: number, config: any) {
  const base = config.sitradUrl.replace(/\/+$/, '')
  const r = await axios.get(`${base}/instruments/${id}/values`, {
    auth: { username: config.username, password: config.password },
    httpsAgent: agent
  })
  return (r.data || {}) as SitradValuesResponse
}



export async function getInstrumentsWithValues(config: any) {
  const list = await getInstruments(config)

  return Promise.all(list.map(async (inst): Promise<InstrumentSnapshot> => {
    try {
      const values = await getValues(inst.id, config)
      if (values.error) {
        return {
          id: inst.id,
          name: inst.name || "instrument missing name",
          modelId: inst.modelId ?? null,
          error: values.error,
        }
      }

      const mappedValues = values.results?.reduce(
        (
          acc: Record<string, boolean | number | string | null>,
          result: IResult
        ) => {
          const firstValue = result.values?.[0]?.value
          if (firstValue !== undefined) {
            acc[result.code] = firstValue
          }
          return acc;
        },
        {}
      ) ?? {}

      return {
        ...inst,
        ...mappedValues
      }
    } catch (err) {
      return {
        ...inst,
        name: inst.name || 'instrument missing name',
        error: err instanceof Error ? err.message : String(err)
      }
    }
  }))
}
