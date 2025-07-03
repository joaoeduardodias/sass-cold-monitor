import type { AbilityBuilder } from '@casl/ability'

import type { AppAbility } from '.'
import type { User } from './models/user'

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
) => void

type Role = 'ADMIN' | 'OPERATOR' | 'OBSERVER' | 'EDITOR'

export const permissions: Record<Role, PermissionsByRole> = {
  ADMIN: (_, { can }) => {
    can('manage', 'all')
  },
  OPERATOR: (_, { can }) => {
    can('invite', 'User')
    can('manage', 'User')
  },
  OBSERVER: (_, { can }) => {
    can('manage', 'User')
  },
  EDITOR: (_, { can }) => {
    can('manage', 'User')
  },
}
