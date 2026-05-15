import { Gauge } from 'lucide-react'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { FormForgotPassword } from './components/form-forgot-password'

export default async function ForgotPasswordPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        {/* logo */}
        <div className="mb-2 flex items-center justify-center gap-3">
          <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-3 shadow-lg">
            <Gauge className="h-8 w-8 text-white" />
          </div>
        </div>

        <CardTitle className="text-center text-2xl">Recuperar senha</CardTitle>

        <CardDescription className="text-center">
          Enviaremos um link de recuperação para seu email
        </CardDescription>
      </CardHeader>

      <FormForgotPassword />
    </Card>
  )
}
