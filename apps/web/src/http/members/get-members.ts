import type { Role } from "@cold-monitor/auth"
import { api } from "../api"

interface GetMembersResponse {
  members: {
    id: string
    userId: string
    role: Role
    name: string | null
    isActive: boolean
    email: string
    avatarUrl: string | null
  }[]
}

export async function getMembers(org: string) {
  const result = await api
    .get(`organizations/${org}/members`, {
      next: {
        tags: [`${org}/members`],
      },
    })
    .json<GetMembersResponse>()

  return result
}