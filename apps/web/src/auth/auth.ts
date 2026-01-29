import { defineAbilityFor } from '@cold-monitor/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getMembership } from '@/http/get-membership';
import { getProfile } from '@/http/get-profile';


export async function getToken(): Promise<string | undefined> {
  try {
    const cookiesStore = await cookies();
    return cookiesStore.get('token')?.value;
  } catch {
    return undefined;
  }
}
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}


export async function getCurrentOrg() {
  const cookiesStore = await cookies();
  return cookiesStore.get('org')?.value;
}

export async function getCurrentMembership() {
  const org = await getCurrentOrg()

  if (!org) {
    return null
  }

  const { membership } = await getMembership(org)

  return membership
}

export async function ability() {
  const membership = await getCurrentMembership()

  if (!membership) {
    return null
  }

  const ability = defineAbilityFor({
    __typename: "User",
    id: membership.userId,
    role: membership.role,
  })

  return ability
}

export async function auth() {
  const token = await getToken()

  if (!token) {
    redirect('/auth/sign-in')
  }

  try {
    const { user } = await getProfile()

    return { user }
  } catch { }

  redirect('/api/auth/sign-out')
}