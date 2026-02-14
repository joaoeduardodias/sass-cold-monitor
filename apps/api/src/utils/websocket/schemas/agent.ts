import { z } from 'zod/v4'

import { InstrumentType } from '@/prisma/generated/enums'

export const authAgentPayloadSchema = z.object({
  organizationId: z.uuid().optional(),
  token: z.string().min(1),
})

export const createInstrumentPayloadSchema = z.object({
  name: z.string().min(1),
  idSitrad: z.number().int().optional(),
  organizationId: z.uuid(),
  processStatusText: z.string().optional(),
  type: z.enum(InstrumentType),
  model: z.number().int(),
})

const normalizedReadingSchema = z.object({
  id: z.string().min(1),
  idSitrad: z.number().int(),
  name: z.string().min(1),
  model: z.number().int(),
  orderDisplay: z.number().int(),
  type: z.string().min(1),
  process: z.string(),
  status: z.string(),
  isSensorError: z.boolean(),
  maxValue: z.number(),
  minValue: z.number(),
  setPoint: z.number(),
  temperature: z.number(),
  createdAt: z.null(),
  differential: z.number(),
})

const temperatureReadingPayloadSchema = z.object({
  readings: z.array(normalizedReadingSchema),
})

export const agentEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('AUTH'),
    payload: authAgentPayloadSchema,
  }),

  z.object({
    type: z.literal('INSTRUMENT_CREATE'),
    payload: createInstrumentPayloadSchema,
  }),

  z.object({
    type: z.literal('TEMPERATURE_READING'),
    payload: temperatureReadingPayloadSchema,
  }),
])
