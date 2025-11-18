"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle, Gauge, Loader2, Mail } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!email || !email.includes("@")) {
      toast.error("Por favor, insira um email válido")
      setLoading(false)
      return
    }

    // Simular envio de email
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setSent(true)
    setLoading(false)
    toast.success("Email de recuperação enviado!")
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-3 bg-green-600 rounded-full">
                <CheckCircle className="size-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Email enviado!</h1>
            <p className="text-muted-foreground mt-2">Verifique sua caixa de entrada</p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 text-center space-y-4">
              <p>Enviamos um link de recuperação para:</p>
              <p className="font-medium text-blue-600">{email}</p>
              <p className="text-sm text-muted-foreground">
                Se você não receber o email em alguns minutos, verifique sua pasta de spam.
              </p>
              <div className="pt-4">
                <Button asChild className="w-full">
                  <Link href="/auth/sign-in">
                    <ArrowLeft className="mr-2 size-4" />
                    Voltar ao login
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Gauge className="size-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Esqueceu a senha?</h1>
          <p className="text-muted-foreground mt-2">Não se preocupe, vamos ajudar você</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Recuperar senha</CardTitle>
            <CardDescription className="text-center">
              Digite seu email para receber um link de recuperação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar link de recuperação"
                )}
              </Button>
            </form>

            <div className="text-center">
              <Link href="/auth/sign-in" className="text-sm text-blue-600 hover:underline inline-flex items-center">
                <ArrowLeft className="mr-1 size-3" />
                Voltar ao login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
