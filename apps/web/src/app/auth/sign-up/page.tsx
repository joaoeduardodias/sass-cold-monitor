import { Gauge } from 'lucide-react'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { FormSignUp } from './components/form-sign-up'

export default async function SignUpPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        {/* logo */}
        <div className="mb-2 flex items-center justify-center gap-3">
          <div className="rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 p-3 shadow-lg">
            <Gauge className="h-8 w-8 text-white" />
          </div>
        </div>

        <CardTitle className="text-center text-2xl">Criar conta</CardTitle>

        <CardDescription className="text-center">
          Comece a usar o ColdMonitor gratuitamente
        </CardDescription>
      </CardHeader>
      <FormSignUp />
    </Card>
  )
}
