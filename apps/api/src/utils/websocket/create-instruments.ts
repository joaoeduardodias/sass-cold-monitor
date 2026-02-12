
import { prisma } from '@/lib/prisma'

import type { InstrumentType } from '@/prisma/generated/enums'
import { createSlug } from '../create-slug'

interface CreateInstrumentPayload {
  name: string
  idSitrad?: number
  organizationId: string
  model: number
  type: InstrumentType
}

export async function handleCreateInstrument(payload: CreateInstrumentPayload) {
  const { name, idSitrad, organizationId, model, type } = payload

  const slug = createSlug(name)

  const instrument = await prisma.instrument.upsert({
    where: {
      organizationId_slug: {
        organizationId,
        slug,
      },
    },
    create: {
      name,
      slug,
      organizationId,
      idSitrad,
      model,
      type,
    },
    update: {
      idSitrad,
      model,
      type,
      name,
      updatedAt: new Date(),
    },
  })
  return instrument
}
