import { defineAbilityFor, userSchema } from "@cold-monitor/auth";
import type { Role } from "@prisma/client";

export function getUserPermissions(userId: string, role: Role) {
  const authUser = userSchema.parse({
    id: userId,
    role: role,
  })

  const ability = defineAbilityFor(authUser)
  return ability
}