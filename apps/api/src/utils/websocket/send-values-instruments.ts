import { prisma } from '@/lib/prisma'
import type { InstrumentWebSocket } from './schemas/agent'



export async function handleValuesInstruments(
  payload: InstrumentWebSocket,
) {
  const instrumentsSlug = payload.map((reading) => reading.slug)

  const instruments = await prisma.instrument.findMany({
    where: {
      slug: { in: instrumentsSlug },
    },
    select: {
      id: true,
      slug: true,
      minValue: true,
      maxValue: true,
    },
  })

  const map = new Map(instruments.map((instrument) => [instrument.slug, instrument]))

  const toSave = payload.flatMap((reading) => {
    const inst = map.get(reading.slug)
    if (!inst) {
      return []
    }
    return [{
      instrumentId: inst.id,
      idSitrad: reading.idSitrad,
      name: reading.name,
      slug: reading.slug,
      model: reading.model,
      type: reading.type,
      organizationId: reading.organizationId,
      minValue: inst.minValue,
      maxValue: inst.maxValue,
      value: reading.value,
      status: reading.status,
      isFan: reading.isFan,
      error: reading.error,
      isSensorError: reading.isSensorError,
      setPoint: reading.setPoint,
      differential: reading.differential,
    }]
  })

  if (toSave.length > 0) {
    await prisma.instrumentData.createMany({
      data: toSave.map((entry) => ({
        instrumentId: entry.instrumentId,
        data: entry.value,
        editData: entry.value,
      })),
    })
  }

  return toSave
}
