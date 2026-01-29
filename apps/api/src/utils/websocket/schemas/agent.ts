import { z } from 'zod/v4'

import { InstrumentType } from '@/prisma/generated/enums'

export const createInstrumentPayloadSchema = z.object({
  name: z.string().min(1),
  idSitrad: z.number().int().optional(),
  organizationId: z.uuid(),
  processStatusText: z.string().optional(),
  type: z.enum(InstrumentType),
  model: z.number().int(),
})

const temperatureReadingPayloadSchema = z.object({
  readings: z.array(
    z.object({
      instrumentId: z.uuid(),
      data: z.array(z.any()),
    }),
  ),
})

export const agentEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('INSTRUMENT_CREATE'),
    payload: createInstrumentPayloadSchema,
  }),

  z.object({
    type: z.literal('TEMPERATURE_READING'),
    payload: temperatureReadingPayloadSchema,
  }),
])
