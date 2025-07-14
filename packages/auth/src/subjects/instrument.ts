import { z } from 'zod/v4'

import { instrumentSchema } from '../models/instrument'

export const instrumentSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal('Instrument'), instrumentSchema]),
])

export type InstrumentSubject = z.infer<typeof instrumentSubject>
