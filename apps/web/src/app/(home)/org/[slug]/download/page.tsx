import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Header } from '@/components/header'
import { getOrganization } from '@/http/organizations/get-organization'

import { DownloadCollectorCard } from './download-collector-card'

export default async function DownloadCollectorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { organization } = await getOrganization(slug)

  return (
    <>
      <Header />
      <main className="container mx-auto py-6 min-[1200px]:px-4">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href={`/org/${slug}`}
            className="inline-flex size-10 items-center justify-center rounded-md border border-border hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <div>
            <h1 className="text-2xl font-bold">Download do App Coletor</h1>
            <p className="text-muted-foreground">
              Organização: {organization.name}
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <DownloadCollectorCard organizationId={organization.id} />

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Como ativar a API do Sitrad PRO</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Acesse o Sitrad PRO e abra as configurações do servidor.</li>
              <li>No menu do servidor, entre na seção de API.</li>
              <li>Informe e ative a licença da API.</li>
              <li>Crie um usuário e senha para acesso da API.</li>
              <li>Crie um grupo para a API e conceda permissões de leitura e escrita.</li>
            </ol>
          </section>
        </div>
      </main>
    </>
  )
}
