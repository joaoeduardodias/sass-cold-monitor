import type { Role } from "@cold-monitor/auth"
import { api } from "../api"

interface CreateInviteRequest {
  org: string
  email: string
  role: Role
}

type CreateInviteResponse = void

export async function createInvite({
  org,
  email,
  role,
}: CreateInviteRequest): Promise<{ inviteId: string }> {
  const result = await api.post(`organizations/${org}/invites`, {
    json: {
      email,
      role,
    },
  }).json<{ inviteId: string }>()

  return result
}
