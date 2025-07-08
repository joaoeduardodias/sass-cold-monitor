import { z } from 'zod'

export const organizationSchema = z.object({
  __typename: z.literal('Organization'),
  organization_id: z.string().uuid(),
})

export type Company = z.infer<typeof organizationSchema>
