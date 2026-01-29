import { api } from "../api"

interface RemoveMemberRequest {
  org: string
  memberId: string
}

export async function removeMember({ org, memberId }: RemoveMemberRequest) {
  await api.delete(`organizations/${org}/members/${memberId}`)
}