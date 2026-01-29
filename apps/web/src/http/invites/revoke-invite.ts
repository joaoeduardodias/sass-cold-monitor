import { api } from "../api"

interface RevokeInviteRequest {
  org: string
  inviteId: string
}

export async function revokeInvite({ org, inviteId }: RevokeInviteRequest) {
  await api.delete(`organizations/${org}/invites/${inviteId}`)
}