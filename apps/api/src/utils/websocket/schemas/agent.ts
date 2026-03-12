import { z } from 'zod'

import { InstrumentType } from '@/prisma/generated/enums'

export const authAgentPayloadSchema = z.object({
  organizationId: z.uuid().optional(),
  token: z.string().min(1),
})

export const createInstrumentSchema = z.array(z.object({
  idSitrad: z.number(),
  name: z.string().min(1),
  slug: z.string().min(1),
  model: z.number(),
  type: z.enum(InstrumentType),
  organizationId: z.uuid(),
}))
export type CreateInstrumentType = z.infer<typeof createInstrumentSchema>


const instrumentReadingSchema = z.object({
  idSitrad: z.number().int(),
  name: z.string().min(1),
  slug: z.string().min(1),
  model: z.number().int(),
  type: z.enum(InstrumentType),
  value: z.number(),
  status: z.string(),
  setPoint: z.preprocess((value) => value ?? 0, z.number()),
  differential: z.preprocess((value) => value ?? 0, z.number()),
  isFan: z.boolean(),
  error: z.boolean(),
  isSensorError: z.boolean().default(false),
  organizationId: z.string().min(1),
})

export const instrumentWebSocketSchema = z.array(instrumentReadingSchema)

export type InstrumentWebSocket = z.infer<typeof instrumentWebSocketSchema>


export const agentEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('AUTH'),
    payload: authAgentPayloadSchema,
  }),

  z.object({
    type: z.literal('INSTRUMENT_CREATE'),
    payload: createInstrumentSchema,
  }),

  z.object({
    type: z.literal('INSTRUMENT_READING'),
    payload: instrumentWebSocketSchema,
  }),
])
