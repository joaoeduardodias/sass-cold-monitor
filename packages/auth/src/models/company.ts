import { z } from 'zod'

export const companySchema = z.object({
  __typename: z.literal('Company'),
  company_id: z.string().uuid(),
})

export type Company = z.infer<typeof companySchema>
