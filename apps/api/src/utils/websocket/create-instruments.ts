import { prisma } from '@/lib/prisma'
import pLimit from 'p-limit'

import type { InstrumentType } from '@/prisma/generated/enums'
import { createSlug } from '../create-slug'
import type { CreateInstrumentType } from './schemas/agent'

const limit = pLimit(10)

interface ResponseInstruments {
  organizationId: string;
  type: InstrumentType;
  id: string;
  slug: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  idSitrad: number | null;
  model: number;
  orderDisplay: number;
  maxValue: number;
  minValue: number;
}

export async function handleCreateInstruments(
  instruments: CreateInstrumentType,
): Promise<ResponseInstruments[]> {
  if (!instruments?.length) return []

  const now = new Date()

  const byOrg = new Map<string, CreateInstrumentType>()

  for (const inst of instruments) {
    if (!byOrg.has(inst.organizationId)) {
      byOrg.set(inst.organizationId, [])
    }
    byOrg.get(inst.organizationId)!.push(inst)
  }

  const results = []

  for (const [organizationId, orgInstruments] of byOrg.entries()) {
    const slugs = orgInstruments.map((i) => createSlug(i.name))

    const existing = await prisma.instrument.findMany({
      where: {
        organizationId,
        slug: { in: slugs },
      },
    })

    const existingMap = new Map(existing.map((i) => [i.slug, i]))

    const toCreate = []
    const toUpdate = []

    for (const inst of orgInstruments) {
      const found = existingMap.get(inst.slug)

      if (!found) {
        toCreate.push({
          name: inst.name,
          slug: inst.slug,
          organizationId,
          idSitrad: inst.idSitrad,
          model: inst.model,
          type: inst.type,
        })
      } else {
        if (
          found.idSitrad !== inst.idSitrad ||
          found.model !== inst.model ||
          found.type !== inst.type ||
          found.name !== inst.name
        ) {
          toUpdate.push({
            id: found.id,
            data: {
              name: inst.name,
              idSitrad: inst.idSitrad,
              model: inst.model,
              type: inst.type,
              updatedAt: now,
            },
          })
        }
      }
    }

    if (toCreate.length) {
      await prisma.instrument.createMany({
        data: toCreate,
        skipDuplicates: true,
      })
    }

    if (toUpdate.length) {
      await Promise.all(
        toUpdate.map((u) =>
          limit(() =>
            prisma.instrument.update({
              where: { id: u.id },
              data: u.data,
            }),
          ),
        ),
      )
    }

    const final = await prisma.instrument.findMany({
      where: {
        organizationId,
        slug: { in: slugs },
      },
    })

    results.push(...final)
  }

  return results
}