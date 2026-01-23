import { prisma } from '@/lib/prisma'

interface InstrumentReading {
  instrumentId: string
  data: number
}

interface DataReadingPayload {
  readings: InstrumentReading[]
}

interface FormattedInstrumentData {
  instrumentId: string
  data: number
  name: string
  idSitrad: number | null
  isActive: boolean
  maxValue: number
  minValue: number
  model: number
  orderDisplay: number
  type: string
  slug: string
}

export async function handleValuesInstruments(payload: DataReadingPayload) {
  const { readings } = payload

  if (!readings.length) {
    return []
  }

  const instruments = await prisma.instrument.findMany({
    where: {
      id: {
        in: readings.map((r) => r.instrumentId),
      },
    },
    select: {
      id: true,
      name: true,
      idSitrad: true,
      isActive: true,
      maxValue: true,
      minValue: true,
      model: true,
      orderDisplay: true,
      type: true,
      slug: true,
    },
  })

  const instrumentMap = new Map(instruments.map((inst) => [inst.id, inst]))

  await prisma.instrumentData.createMany({
    data: readings.map((r) => ({
      instrumentId: r.instrumentId,
      data: r.data,
      editData: r.data,
    })),
  })

  const formattedData: FormattedInstrumentData[] = readings
    .map((r) => {
      const instrument = instrumentMap.get(r.instrumentId)
      if (!instrument) return null

      return {
        instrumentId: instrument.id,
        data: r.data,
        name: instrument.name,
        idSitrad: instrument.idSitrad,
        isActive: instrument.isActive,
        maxValue: instrument.maxValue,
        minValue: instrument.minValue,
        model: instrument.model,
        orderDisplay: instrument.orderDisplay,
        type: instrument.type,
        slug: instrument.slug,
      }
    })
    .filter(Boolean) as FormattedInstrumentData[]

  return formattedData
}
