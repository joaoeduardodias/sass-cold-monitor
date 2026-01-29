import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gauge } from "lucide-react"
import { FormSignUp } from "./components/form-sign-up"

export default async function SignUpPage() {
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
          Criar conta
        </CardTitle>

        <CardDescription className="text-center">
          Comece a usar o ColdMonitor gratuitamente
        </CardDescription>
      </CardHeader>
      <FormSignUp />
    </Card>
  )
}
