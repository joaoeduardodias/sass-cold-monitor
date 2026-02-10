import { api } from "../api"

interface RevokeInviteRequest {
  org: string
  inviteId: string
}

export async function revokeInvite({ org, inviteId }: RevokeInviteRequest) {
  await api.post(`organizations/${org}/invites/${inviteId}`)
}
