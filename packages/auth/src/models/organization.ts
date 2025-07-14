import { z } from 'zod/v4'

export const organizationSchema = z.object({
  __typename: z.literal('Organization').default('Organization'),
  id: z.string(),
  ownerId: z.string(),
})

export type Company = z.infer<typeof organizationSchema>
