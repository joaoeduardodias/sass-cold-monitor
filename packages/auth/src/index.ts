import type { CreateAbility, MongoAbility } from '@casl/ability'
import { AbilityBuilder, createMongoAbility } from '@casl/ability'
import { z } from 'zod'

import type { User } from './models/user'
import { permissions } from './permissions'
import { instrumentDataSubject } from './subjects/data'
import { instrumentSubject } from './subjects/instrument'
import { organizationSubject } from './subjects/organization'
import { userSubject } from './subjects/user'

export * from './models/instrument'
export * from './models/instrument-data'
export * from './models/organization'
export * from './models/user'

const appAbilitiesSchema = z.union([
  instrumentDataSubject,
  userSubject,
  organizationSubject,
  instrumentSubject,
  z.tuple([z.literal('manage'), z.literal('all')]),
])

type AppAbilities = z.infer<typeof appAbilitiesSchema>

export type AppAbility = MongoAbility<AppAbilities>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilityFor(user: User) {
  const builder = new AbilityBuilder(createAppAbility)
  if (typeof permissions[user.role] !== 'function') {
    throw new Error(`Permissions for role ${user.role} not defined.`)
  }
  permissions[user.role](user, builder)
  const ability = builder.build()
  return ability
}
