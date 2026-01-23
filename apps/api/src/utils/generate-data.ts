import { prisma } from '@/lib/prisma'
import { Prisma } from '@/prisma/generated/client'

interface GenerateInstrumentDataInput {
  instrumentId: string
  type: 'TEMPERATURE' | 'PRESSURE'
  startDate: Date
  endDate: Date
  defrostDate?: Date
  variation: number
  initialTemp?: number
  averageTemp?: number
}

interface GeneratedInstrumentData {
  instrumentId: string
  createdAt: Date
  data: number
  editData: number
  generateData: number
  userEditData: string | null
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function generateInstrumentData({
  instrumentId,
  type,
  startDate,
  endDate,
  defrostDate,
  variation,
  initialTemp,
  averageTemp,
}: GenerateInstrumentDataInput): GeneratedInstrumentData[] {
  const intervalMinutes = 5
  const result: GeneratedInstrumentData[] = []

  let currentValue =
    initialTemp ??
    averageTemp ??
    (type === 'TEMPERATURE' ? randomBetween(-5, 5) : randomBetween(1, 3))

  const avg = averageTemp ?? currentValue
  const maxVariation = variation

  for (
    let current = new Date(startDate);
    current <= endDate;
    current = new Date(current.getTime() + intervalMinutes * 60_000)
  ) {
    const isDefrost =
      defrostDate &&
      Math.abs(current.getTime() - defrostDate.getTime()) < 30 * 60_000 // 30 min

    let delta = randomBetween(-maxVariation, maxVariation)

    if (type === 'PRESSURE') {
      delta = delta * 0.3 // pressão varia menos
    }

    if (isDefrost && type === 'TEMPERATURE') {
      delta = randomBetween(0.5, 1.5) // pico positivo
    }

    currentValue += delta

    // força retorno à média ao longo do tempo
    currentValue += (avg - currentValue) * 0.02

    currentValue = clamp(
      currentValue,
      avg - maxVariation * 3,
      avg + maxVariation * 3,
    )

    result.push({
      instrumentId,
      createdAt: new Date(current),
      data: Number(currentValue.toFixed(2)),
      editData: 0,
      generateData: 1,
      userEditData: null,
    })
  }

  return result
}

export async function saveInstrumentData(
  formatInstrumentDataResult: GeneratedInstrumentData[],
) {
  if (formatInstrumentDataResult.length === 0) return

  const batchSize = 5000

  for (let i = 0; i < formatInstrumentDataResult.length; i += batchSize) {
    const batch = formatInstrumentDataResult.slice(i, i + batchSize)

    const values = Prisma.join(
      batch.map(
        (d) =>
          Prisma.sql`(
          gen_random_uuid(),
          ${d.createdAt},
          now(),
          ${d.instrumentId},
          ${d.data},
          ${d.editData},
          ${d.generateData ?? null},
          ${d.userEditData ?? null}
        )`,
      ),
    )

    await prisma.$executeRaw`
    INSERT INTO "instrument_data" (
      id,
      created_at,
      updated_at,
      instrument_id,
      data,
      edit_data,
      generate_data,
      user_edit_data
    )
    VALUES ${values}
    ON CONFLICT ("instrument_id", "created_at")
    DO UPDATE SET "edit_data" = EXCLUDED."edit_data"
  `
  }
}
