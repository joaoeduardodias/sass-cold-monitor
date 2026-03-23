import type { AbilityBuilder } from '@casl/ability'

import type { AppAbility } from '.'
import type { User } from './models/user'
import type { Role } from './role'

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
) => void

export const permissions: Record<Role, PermissionsByRole> = {
  ADMIN: (_user, { can }) => {
    can('manage', 'all')
  },
  OPERATOR: (_user, { can }) => {
    can(['get', 'read', 'update'], 'Instrument')
  },
  VIEWER: (_user, { can }) => {
    can(['get', 'read'], 'Instrument')
    can('read', 'InstrumentData')
  },
  EDITOR: (_user, { can }) => {
    can(['get', 'read'], 'Instrument')
    can(['read', 'create', 'update'], 'InstrumentData')
  },
}
