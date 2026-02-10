import type { Role } from "@/prisma/generated/enums";
import { defineAbilityFor, userSchema } from "@cold-monitor/auth";

export function getUserPermissions(userId: string, role: Role) {
  const authUser = userSchema.parse({
    __typename: "User",
    id: userId,
    role: role,
  })

  const ability = defineAbilityFor(authUser)
  return ability
}
