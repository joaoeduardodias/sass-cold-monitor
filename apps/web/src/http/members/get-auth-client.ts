

export async function getAuthClient() {
  const res = await fetch("/api/auth/session")
  if (!res.ok) return
  const result = await res.json()
  return result
}