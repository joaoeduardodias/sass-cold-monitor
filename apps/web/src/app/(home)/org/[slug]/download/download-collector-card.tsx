'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { api } from '@/http/api'

type DownloadCollectorCardProps = {
  organizationId: string
}

type BootstrapResponse = {
  setupToken: string
  stopPassword: string
}

type LatestCollectorResponse = {
  latest: {
    setupToken: string
    stopPassword: string
    createdAt: string
  } | null
}

const defaultDownloadUrl = '/downloads/coldmonitor-collector-setup.exe'

export function DownloadCollectorCard({
  organizationId,
}: DownloadCollectorCardProps) {
  const [setupToken, setSetupToken] = useState('')
  const [stopPassword, setStopPassword] = useState('')
  const [latestToken, setLatestToken] = useState('')
  const [latestStopPassword, setLatestStopPassword] = useState('')
  const [isLoadingToken, setIsLoadingToken] = useState(false)
  const [isLoadingLatest, setIsLoadingLatest] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [latestErrorMessage, setLatestErrorMessage] = useState<string | null>(
    null,
  )
  const [copiedSetupToken, setCopiedSetupToken] = useState(false)
  const [copiedStopPassword, setCopiedStopPassword] = useState(false)

  const collectorDownloadUrl =
    process.env.NEXT_PUBLIC_COLLECTOR_DOWNLOAD_URL ?? defaultDownloadUrl

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

      setLatestToken(response.latest?.setupToken ?? '')
      setLatestStopPassword(response.latest?.stopPassword ?? '')
    } catch {
      setLatestErrorMessage(
        'Não foi possível carregar o último token e senha agora.',
      )
    } finally {
      setIsLoadingLatest(false)
    }
  }

  useEffect(() => {
    loadLatestCredentials()
  }, [organizationId])

  async function handleGenerateSetupToken() {
    setErrorMessage(null)
    setSetupToken('')
    setStopPassword('')
    setCopiedSetupToken(false)
    setCopiedStopPassword(false)
    setIsLoadingToken(true)

    try {
      const response = await api
        .post('devices/auth/bootstrap', {
          json: {
            organizationId,
          },
        })
        .json<BootstrapResponse>()

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
    <section className="border-border bg-card rounded-xl border p-6">
      <h2 className="text-xl font-semibold">App Coletor para Windows</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Baixe o instalador, gere o token de ativação e use esse token no
        primeiro acesso do aplicativo.
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
        <div className="bg-muted mt-4 rounded-md p-4">
          <p className="text-sm font-medium">Token de ativação</p>
          <p className="mt-2 font-mono text-xs break-all">{setupToken}</p>
          <Button
            type="button"
            onClick={handleCopyToken}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            {copiedSetupToken ? 'Copiado' : 'Copiar token'}
          </Button>

          <p className="mt-4 text-sm font-medium">
            Senha de parada (stopPassword)
          </p>
          <p className="mt-2 font-mono text-xs break-all">{stopPassword}</p>
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

      <div className="bg-muted mt-4 rounded-md p-4">
        <p className="text-sm font-medium">Último token e senha gerados</p>

        {isLoadingLatest && (
          <p className="text-muted-foreground mt-2 text-xs">Carregando...</p>
        )}

        {latestErrorMessage && (
          <p className="mt-2 text-xs text-red-600">{latestErrorMessage}</p>
        )}

        {!isLoadingLatest && !latestErrorMessage && !latestToken && (
          <p className="text-muted-foreground mt-2 text-xs">
            Nenhum token foi gerado para esta organização ainda.
          </p>
        )}

        {!isLoadingLatest && !latestErrorMessage && latestToken && (
          <>
            <p className="mt-3 text-xs font-medium">Token</p>
            <p className="mt-1 font-mono text-xs break-all">{latestToken}</p>

            <p className="mt-3 text-xs font-medium">Senha (stopPassword)</p>
            <p className="mt-1 font-mono text-xs break-all">
              {latestStopPassword}
            </p>
          </>
        )}
      </div>
    </section>
  )
}
