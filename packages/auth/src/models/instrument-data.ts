import { z } from 'zod'

export const instrumentDataSchema = z.object({
  __typename: z.literal('InstrumentData'),
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
})

export type Data = z.infer<typeof instrumentDataSchema>
