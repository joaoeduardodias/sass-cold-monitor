import { z } from 'zod'

import { dataSchema } from '../models/data'

export const dataSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('read'),
    z.literal('create'),
    z.literal('update'),
  ]),
  z.union([z.literal('Data'), dataSchema]),
])

export type DataSubject = z.infer<typeof dataSubject>
