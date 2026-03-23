'use client'

import { Button } from '@/components/ui/button'
import { api } from '@/http/api'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type DownloadCollectorCardProps = {
  organizationId: string
}

type BootstrapResponse = {
  setupToken: string
  stopPassword: string
}

type LatestCollectorResponse = {
  latest: {
    token: string
    stopPassword: string
    createdAt: string
  } | null
}

const defaultDownloadUrl = '/downloads/coldmonitor-collector-setup.exe'

export function DownloadCollectorCard({ organizationId }: DownloadCollectorCardProps) {
  const [setupToken, setSetupToken] = useState('')
  const [stopPassword, setStopPassword] = useState('')
  const [latestToken, setLatestToken] = useState('')
  const [latestStopPassword, setLatestStopPassword] = useState('')
  const [isLoadingToken, setIsLoadingToken] = useState(false)
  const [isLoadingLatest, setIsLoadingLatest] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [latestErrorMessage, setLatestErrorMessage] = useState<string | null>(null)
  const [copiedSetupToken, setCopiedSetupToken] = useState(false)
  const [copiedStopPassword, setCopiedStopPassword] = useState(false)

  const collectorDownloadUrl = process.env.NEXT_PUBLIC_COLLECTOR_DOWNLOAD_URL ?? defaultDownloadUrl

  async function loadLatestCredentials() {
    setLatestErrorMessage(null)
    setIsLoadingLatest(true)

    try {
      const response = await api
        .get('devices/auth/latest', {
          searchParams: {
            organizationId,
          },
        })
        .json<LatestCollectorResponse>()

      setLatestToken(response.latest?.token ?? '')
      setLatestStopPassword(response.latest?.stopPassword ?? '')
    } catch {
      setLatestErrorMessage('Não foi possível carregar o último token e senha agora.')
    } finally {
      setIsLoadingLatest(false)
    }
  }

  useEffect(() => {
    void loadLatestCredentials()
  }, [organizationId])


  async function handleGenerateSetupToken() {
    setErrorMessage(null)
    setSetupToken('')
    setStopPassword('')
    setCopiedSetupToken(false)
    setCopiedStopPassword(false)
    setIsLoadingToken(true)

    try {
      const response = await api.post('devices/auth/bootstrap', {
        json: {
          organizationId,
        },
      }).json<BootstrapResponse>()

      setSetupToken(response.setupToken)
      setStopPassword(response.stopPassword)
      await loadLatestCredentials()
    } catch {
      setErrorMessage('Não foi possível gerar o token de ativação agora.')
    } finally {
      setIsLoadingToken(false)
    }
  }

  async function handleCopyToken() {
    if (!setupToken) return

    await navigator.clipboard.writeText(setupToken)
    setCopiedSetupToken(true)
  }

  async function handleCopyStopPassword() {
    if (!stopPassword) return

    await navigator.clipboard.writeText(stopPassword)
    setCopiedStopPassword(true)
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold">App Coletor para Windows</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Baixe o instalador, gere o token de ativação e use esse token no primeiro acesso do aplicativo.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href={collectorDownloadUrl} download>
            Baixar coletor (.exe)
          </Link>
        </Button>

        <Button
          type="button"
          onClick={handleGenerateSetupToken}
          disabled={isLoadingToken}
          variant="outline"
          size="lg"
        >
          {isLoadingToken ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Gerando...
            </>
          ) : (
            'Gerar token de ativação'
          )}
        </Button>
      </div>

      {errorMessage && (
        <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
      )}

      {setupToken && (
        <div className="mt-4 rounded-md bg-muted p-4">
          <p className="text-sm font-medium">Token de ativação</p>
          <p className="mt-2 break-all font-mono text-xs">{setupToken}</p>
          <Button
            type="button"
            onClick={handleCopyToken}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            {copiedSetupToken ? 'Copiado' : 'Copiar token'}
          </Button>

          <p className="mt-4 text-sm font-medium">Senha de parada (stopPassword)</p>
          <p className="mt-2 break-all font-mono text-xs">{stopPassword}</p>
          <Button
            type="button"
            onClick={handleCopyStopPassword}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            {copiedStopPassword ? 'Copiado' : 'Copiar senha'}
          </Button>
        </div>
      )}

      <div className="mt-4 rounded-md bg-muted p-4">
        <p className="text-sm font-medium">Último token e senha gerados</p>

        {isLoadingLatest && (
          <p className="mt-2 text-xs text-muted-foreground">Carregando...</p>
        )}

        {latestErrorMessage && (
          <p className="mt-2 text-xs text-red-600">{latestErrorMessage}</p>
        )}

        {!isLoadingLatest && !latestErrorMessage && !latestToken && (
          <p className="mt-2 text-xs text-muted-foreground">
            Nenhum token foi gerado para esta organização ainda.
          </p>
        )}

        {!isLoadingLatest && !latestErrorMessage && latestToken && (
          <>
            <p className="mt-3 text-xs font-medium">Token</p>
            <p className="mt-1 break-all font-mono text-xs">{latestToken}</p>

            <p className="mt-3 text-xs font-medium">Senha (stopPassword)</p>
            <p className="mt-1 break-all font-mono text-xs">{latestStopPassword}</p>
          </>
        )}
      </div>
    </section>
  )
}
