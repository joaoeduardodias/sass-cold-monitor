/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma'

interface ValueEntry {
  value: string | number
}

interface DataEntry {
  code: string
  values: ValueEntry[][]
}

interface InstrumentReading {
  instrumentId: string
  data: {
    code: string
    name: string | null
    values: DataEntry[]
  }[]
}

interface DataReadingPayload {
  readings: InstrumentReading[]
}

function findEntry(data: any[], code: string) {
  return data.find((d) => d.code === code) ?? null
}

function extractPrimaryValue(data: any[], model?: number): number {
  const sensor1 = findEntry(data, 'Sensor1')
  const pressure = findEntry(data, 'Pressure')
  const temperature = findEntry(data, 'Temperature')
  const sensor1Value = sensor1?.values[0].value ?? null
  const temperatureValue = temperature?.values[0].value ?? null
  const pressureValue = pressure?.values[0].value ?? null

  switch (model) {
    case 72:
      return Number(Number(sensor1Value).toFixed(1))

    case 67:
      return Number(Number(pressureValue).toFixed(1))

    default:
      return Number(Number(temperatureValue).toFixed(1))
  }
}

export async function handleValuesInstruments(payload: DataReadingPayload) {
  if (!Array.isArray(payload.readings)) {
    payload.readings = Object.values(payload.readings)
  }

  const instrumentIds = payload.readings.map((r) => r.instrumentId)

  const instruments = await prisma.instrument.findMany({
    where: { id: { in: instrumentIds } },
    select: {
      id: true,
      model: true,
      name: true,
      minValue: true,
      maxValue: true,
      organizationId: true,
    },
  })

  const map = new Map(instruments.map((i) => [i.id, i]))

  const toSave = payload.readings.map((r) => {
    const inst = map.get(r.instrumentId)
    const primary = extractPrimaryValue(r.data, inst?.model)
    return {
      instrumentId: r.instrumentId,
      instrumentName: inst?.name ?? r.instrumentId,
      organizationId: inst?.organizationId ?? '',
      minValue: Number(inst?.minValue ?? 0),
      maxValue: Number(inst?.maxValue ?? 0),
      data: primary,
      editData: primary,
    }
  })

  await prisma.instrumentData.createMany({
    data: toSave,
  })
  return toSave
}
