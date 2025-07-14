import { z } from 'zod/v4'

import { roleSchema } from '../role'

export const userSchema = z.object({
  __typename: z.literal('User'),
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  role: roleSchema,
})

export type User = z.infer<typeof userSchema>
