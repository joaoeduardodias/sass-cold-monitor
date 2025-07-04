import { z } from 'zod'

export const dataSchema = z.object({
  __typename: z.literal('Data'),
  id: z.string().uuid(),
  company_id: z.string().uuid(),
})

export type Data = z.infer<typeof dataSchema>
