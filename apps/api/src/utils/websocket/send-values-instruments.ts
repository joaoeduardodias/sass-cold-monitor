import { prisma } from '@/lib/prisma'

type NormalizedReading = {
  id: string
  idSitrad: number
  name: string
  model: number
  orderDisplay: number
  type: string
  process: string
  status: string
  isSensorError: boolean
  maxValue: number
  minValue: number
  setPoint: number
  temperature: number
  createdAt: null
  differential: number
}

type DataReadingPayload = {
  readings: NormalizedReading[]
}

type HandleValuesOptions = {
  organizationId?: string
}

type InstrumentRealtimeState = {
  temperature: number | null
  pressure: number | null
  setpoint: number | null
  differential: number | null
}

const latestRealtimeStateByInstrument = new Map<string, InstrumentRealtimeState>()

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return Number(value.toFixed(1))
}

function isPressureInstrument(model?: number, type?: string) {
  if (model === 67) {
    return true
  }

  return String(type ?? '').toUpperCase().includes('PRESS')
}

export async function handleValuesInstruments(
  payload: DataReadingPayload,
  options?: HandleValuesOptions,
) {
  const instrumentIds = payload.readings.map((r) => r.id)

  const instruments = await prisma.instrument.findMany({
    where: {
      id: { in: instrumentIds },
      ...(options?.organizationId
        ? { organizationId: options.organizationId }
        : {}),
    },
    select: {
      id: true,
      model: true,
      name: true,
      minValue: true,
      maxValue: true,
      organizationId: true,
    },
  })

  const map = new Map(instruments.map((instrument) => [instrument.id, instrument]))

  const toSave = payload.readings.flatMap((reading) => {
    const inst = map.get(reading.id)
    if (!inst) {
      return []
    }

    const previousState = latestRealtimeStateByInstrument.get(reading.id)

    const normalizedValue = toFiniteNumber(reading.temperature)
    const pressureInstrument = isPressureInstrument(inst.model ?? reading.model, reading.type)

    const temperatureValue = pressureInstrument
      ? null
      : (normalizedValue ?? previousState?.temperature ?? null)
    const pressureValue = pressureInstrument
      ? (normalizedValue ?? previousState?.pressure ?? null)
      : null
    const setpoint =
      toFiniteNumber(reading.setPoint) ?? previousState?.setpoint ?? null
    const differential =
      toFiniteNumber(reading.differential) ?? previousState?.differential ?? null

    const primary = pressureInstrument
      ? (pressureValue ?? 0)
      : (temperatureValue ?? 0)

    latestRealtimeStateByInstrument.set(reading.id, {
      temperature: temperatureValue,
      pressure: pressureValue,
      setpoint,
      differential,
    })

    return [{
      instrumentId: reading.id,
      instrumentName: inst.name ?? reading.name,
      organizationId: inst.organizationId,
      minValue: Number(inst.minValue ?? reading.minValue ?? 0),
      maxValue: Number(inst.maxValue ?? reading.maxValue ?? 0),
      data: primary,
      editData: primary,
      temperature: temperatureValue,
      pressure: pressureValue,
      setpoint,
      differential,
    }]
  })

  if (toSave.length > 0) {
    await prisma.instrumentData.createMany({
      data: toSave.map((entry) => ({
        instrumentId: entry.instrumentId,
        data: entry.data,
        editData: entry.editData,
      })),
    })
  }

  return toSave
}
