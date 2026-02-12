import type { AbilityBuilder } from '@casl/ability'

import type { AppAbility } from '.'
import type { User } from './models/user'
import type { Role } from './role'

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
) => void

export const permissions: Record<Role, PermissionsByRole> = {
  ADMIN: (user, { can, cannot }) => {
    can('manage', 'all')
    cannot(['transfer_ownership', 'update'], 'Organization')
    can(['transfer_ownership', 'update'], 'Organization', {
      ownerId: { $eq: user.id },
    })
  },
  OPERATOR: (_user, { can }) => {
    can('update', 'InstrumentData')
  },
  VIEWER: (_user, { can }) => {
    can('read', 'InstrumentData')
  },
  EDITOR: (_user, { can }) => {
    can(['create', 'update'], 'InstrumentData')
  },
}
