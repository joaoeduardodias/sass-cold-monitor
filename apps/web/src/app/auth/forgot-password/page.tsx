import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gauge } from "lucide-react"
import { FormForgotPassword } from "./components/form-forgot-password"

export default async function ForgotPasswordPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        {/* logo */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-3 bg-linear-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
            <Gauge className="h-8 w-8 text-white" />
          </div>
        </div>


        <CardTitle className="text-2xl text-center">
          Recuperar senha
        </CardTitle>

        <CardDescription className="text-center">
          Enviaremos um link de recuperação para seu email
        </CardDescription>
      </CardHeader>

      <FormForgotPassword />
    </Card>
  )
}
