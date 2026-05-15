import { Gauge } from 'lucide-react'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { FormSignIn } from './components/form-sign-in'

const googleErrors: Record<string, string> = {
  google_auth_failed: 'Falha ao autenticar com o Google. Tente novamente.',
  google_missing_code: 'Código de autenticação ausente. Tente novamente.',
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const googleError = error ? (googleErrors[error] ?? null) : null

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="mb-2 flex items-center justify-center gap-3">
          <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-3 shadow-lg">
            <Gauge className="h-8 w-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-center text-2xl">
          Entrar no sistema
        </CardTitle>

        <CardDescription className="text-center">
          Use suas credenciais para acessar o ColdMonitor
        </CardDescription>
      </CardHeader>
      <FormSignIn googleError={googleError} />
    </Card>
  )
}
