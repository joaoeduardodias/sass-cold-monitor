import { z } from 'zod'

import { roleSchema } from '../role'

export const userSchema = z.object({
  __typename: z.literal('User'),
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  role: roleSchema,
})

export type User = z.infer<typeof userSchema>
