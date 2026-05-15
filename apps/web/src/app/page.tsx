import { redirect } from 'next/navigation'

import { getCurrentOrg, isAuthenticated } from '@/auth/auth'
import { Header } from '@/components/header'

export default async function Home() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect('/auth/sign-in')
  }

  const currentOrg = await getCurrentOrg()
  if (!currentOrg) {
    redirect('/select-organization')
  }

  return (
    <>
      <Header />
      <main className="container mx-auto mb-8 pt-4 min-[1200px]:px-4">
        Selecione uma empresa
      </main>
    </>
  )
}
