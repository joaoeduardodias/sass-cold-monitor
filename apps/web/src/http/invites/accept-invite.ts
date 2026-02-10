import { api } from '../api'

export async function acceptInvite(inviteId: string) {
  await api.post(`invites/${inviteId}/accept`)
}