// import logoImg from '@/assets/logo.png'
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import Image from "next/image"
import { Gauge } from 'lucide-react'
import { FormSignIn } from "./components/form-sign-in"

export default async function SignInPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        {/* <div className="flex mx-auto">
          <Image
            src={logoImg}
            alt="ColdMonitor Logo"
            width={30}
            height={30}
            unoptimized
            className="h-8 w-auto mt-1"
          />
        </div> */}
        {/* logo */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-3 bg-linear-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
            <Gauge className="h-8 w-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">
          Entrar no sistema
        </CardTitle>

        <CardDescription className="text-center">
          Use suas credenciais para acessar o ColdMonitor
        </CardDescription>
      </CardHeader>
      <FormSignIn />
    </Card>
  )
}
