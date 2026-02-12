import { api } from "../api"

type UpdateProfileRequest = {
  name: string
  email: string
  avatarUrl: string | null
}

type UpdateProfileResponse = {
  user: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
  }
}

export async function updateProfile({ name, email, avatarUrl }: UpdateProfileRequest) {
  return api.put("profile", {
    json: {
      name,
      email,
      avatarUrl,
    },
  }).json<UpdateProfileResponse>()
}
