import { isAuthenticated } from '@/auth/auth'
import { redirect } from 'next/navigation'

export default async function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    redirect('/auth/sign-in')
  }

  return (
    <div>
      {children}
    </div>
  )
}
