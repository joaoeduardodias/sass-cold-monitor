import { z } from 'zod/v4'

export const roleSchema = z.union([
  z.literal('ADMIN'),
  z.literal('OPERATOR'),
  z.literal('VIEWER'),
  z.literal('EDITOR'),
])

export type Role = z.infer<typeof roleSchema>
