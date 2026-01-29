import { api } from "./api";

interface SignUpRequest {
  name: string
  email: string
  password: string

}
interface SignUpResponse {
  token: string
}

export async function signUp({ email, name, password }: SignUpRequest) {

  const result = await api.post('users',
    { json: { name, email, password } }).json<SignUpResponse>()

  return result

}