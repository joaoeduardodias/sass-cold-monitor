import { api } from "../api";


interface GetProfileResponse {
  user: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
    createdAt: string
    updatedAt: string
    memberships: {
      id: string
      role: "ADMIN" | "EDITOR" | "OPERATOR" | "VIEWER"
      isActive: boolean
      joinedAt: string
      organization: {
        id: string
        name: string
        slug: string
      }
    }[]
    permissions: string[]
  }
}

export async function getProfile() {
  const result = await api.get('profile').json<GetProfileResponse>()

  return result
}
