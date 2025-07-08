import type { AbilityBuilder } from '@casl/ability'

import type { AppAbility } from '.'
import type { User } from './models/user'
import type { Role } from './role'

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
) => void

export const permissions: Record<Role, PermissionsByRole> = {
  SUPER_ADMIN: (_, { can }) => {
    can('manage', 'all')
  },
  ADMIN: (user, { can }) => {
    can('manage', ['InstrumentData', 'Organization', 'User'], {
      organization_id: { $eq: user.organization_id },
    })
  },
  OPERATOR: (user, { can }) => {
    can('update', 'InstrumentData', {
      organization_id: { $eq: user.organization_id },
    })
  },
  VIEWER: (user, { can }) => {
    can('read', 'InstrumentData', {
      organization_id: { $eq: user.organization_id },
    })
  },
  EDITOR: (user, { can }) => {
    can(['create', 'update'], 'InstrumentData', {
      organization_id: { $eq: user.organization_id },
    })
  },
}
