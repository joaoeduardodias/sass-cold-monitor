import { api } from "../api";

export async function rejectInvite(inviteId: string) {
  await api.post(`invites/${inviteId}/reject`)
}