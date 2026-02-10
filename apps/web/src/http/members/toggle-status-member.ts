import { api } from "../api"

interface ToggleStatusMemberRequest {
  org: string
  memberId: string
  status: 'active' | 'inactive'
}

export async function toggleStatusMember({
  org,
  memberId,
  status,
}: ToggleStatusMemberRequest) {
  await api.patch(`organizations/${org}/members/${memberId}/status`, {
    json: { status },
  })
}