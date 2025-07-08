import { z } from 'zod'

import { instrumentDataSchema } from '../models/instrument-data'

export const instrumentDataSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('read'),
    z.literal('create'),
    z.literal('update'),
  ]),
  z.union([z.literal('InstrumentData'), instrumentDataSchema]),
])

export type DataSubject = z.infer<typeof instrumentDataSubject>
