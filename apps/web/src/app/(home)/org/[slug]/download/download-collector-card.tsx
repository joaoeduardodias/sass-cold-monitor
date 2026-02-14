'use client'

import { api } from '@/http/api'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

type DownloadCollectorCardProps = {
  organizationId: string
}

type BootstrapResponse = {
  setupToken: string
}

const defaultDownloadUrl = '/downloads/coldmonitor-collector-setup.exe'

export function DownloadCollectorCard({ organizationId }: DownloadCollectorCardProps) {
  const [setupToken, setSetupToken] = useState('')
  const [isLoadingToken, setIsLoadingToken] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const collectorDownloadUrl = process.env.NEXT_PUBLIC_COLLECTOR_DOWNLOAD_URL ?? defaultDownloadUrl


  async function handleGenerateSetupToken() {
    setErrorMessage(null)
    setCopied(false)
    setIsLoadingToken(true)

    try {
      const response = await api.post('devices/auth/bootstrap', {
        json: {
          organizationId,
        },
      }).json<BootstrapResponse>()

      setSetupToken(response.setupToken)
    } catch {
      setErrorMessage('Não foi possível gerar o token de ativação agora.')
    } finally {
      setIsLoadingToken(false)
    }
  }

  async function handleCopyToken() {
    if (!setupToken) return

    await navigator.clipboard.writeText(setupToken)
    setCopied(true)
  }
  console.log(collectorDownloadUrl);

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold">App Coletor para Windows</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Baixe o instalador, gere o token de ativação e use esse token no primeiro acesso do aplicativo.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={collectorDownloadUrl}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          download
        >
          Baixar coletor (.exe)
        </Link>

        <button
          type="button"
          onClick={handleGenerateSetupToken}
          disabled={isLoadingToken}
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
        >
          {isLoadingToken ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Gerando...
            </>
          ) : (
            'Gerar token de ativação'
          )}
        </button>
      </div>

      {errorMessage && (
        <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
      )}

      {setupToken && (
        <div className="mt-4 rounded-md bg-muted p-4">
          <p className="text-sm font-medium">Token de ativação</p>
          <p className="mt-2 break-all font-mono text-xs">{setupToken}</p>
          <button
            type="button"
            onClick={handleCopyToken}
            className="mt-3 inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium hover:bg-background"
          >
            {copied ? 'Copiado' : 'Copiar token'}
          </button>
        </div>
      )}
    </section>
  )
}
