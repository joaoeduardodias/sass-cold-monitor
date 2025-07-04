import type { CreateAbility, MongoAbility } from '@casl/ability'
import { AbilityBuilder, createMongoAbility } from '@casl/ability'
import { z } from 'zod'

import type { User } from './models/user'
import { permissions } from './permissions'
import { companySubject } from './subjects/company'
import { dataSubject } from './subjects/data'
import { instrumentSubject } from './subjects/instrument'
import { userSubject } from './subjects/user'

const appAbilitiesSchema = z.union([
  dataSubject,
  userSubject,
  companySubject,
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
