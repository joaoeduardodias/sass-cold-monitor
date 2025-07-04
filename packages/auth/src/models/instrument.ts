import { z } from 'zod'

export const instrumentSchema = z.object({
  __typename: z.literal('Instrument'),
  id: z.string().uuid(),
  company_id: z.string().uuid(),
})

export type Instrument = z.infer<typeof instrumentSchema>
