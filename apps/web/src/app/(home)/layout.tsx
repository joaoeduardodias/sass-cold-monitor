import { redirect } from 'next/navigation'

import { isAuthenticated } from '@/auth/auth'

export default async function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    redirect('/auth/sign-in')
  }

  return <div>{children}</div>
}
