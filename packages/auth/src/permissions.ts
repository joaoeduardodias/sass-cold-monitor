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
    can('manage', ['Data', 'Company', 'User'], {
      company_id: { $eq: user.company_id },
    })
  },
  OPERATOR: (user, { can }) => {
    can('update', 'Data', { company_id: { $eq: user.company_id } })
  },
  OBSERVER: (user, { can }) => {
    can('read', 'Data', { company_id: { $eq: user.company_id } })
  },
  EDITOR: (user, { can }) => {
    can(['create', 'update'], 'Data', { company_id: { $eq: user.company_id } })
  },
}
