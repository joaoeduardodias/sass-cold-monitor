import type { Role } from "@cold-monitor/auth"
import { api } from "../api"

interface GetInviteResponse {
  invite: {
    id: string
    role: Role
    email: string
    createdAt: string
    organization: {
      name: string
      slug: string
    }
    author: {
      id: string
      name: string | null
      avatarUrl: string | null
    } | null
  }
}

export async function getInvite(inviteId: string) {
  const result = await api.get(`invites/${inviteId}`).json<GetInviteResponse>()

  return result
}