import { z } from 'zod/v4'

export const instrumentSchema = z.object({
  __typename: z.literal('Instrument'),
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
})

export type Instrument = z.infer<typeof instrumentSchema>
