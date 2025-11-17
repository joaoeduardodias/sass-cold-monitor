"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, BarChart3, Building, CheckCircle, Eye, EyeOff, Gauge, Loader2, Lock, Mail, Shield, User, Zap } from 'lucide-react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useState } from "react"
import { toast } from "sonner"

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (error) setError("")

    if (field === "password" && typeof value === "string") {
      if (value.length === 0) {
        setPasswordStrength(null)
      } else if (value.length < 6) {
        setPasswordStrength("weak")
      } else if (value.length < 10) {
        setPasswordStrength("medium")
      } else {
        setPasswordStrength("strong")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validações
    if (!formData.name || !formData.email || !formData.company || !formData.password || !formData.confirmPassword) {
      setError("Por favor, preencha todos os campos")
      setLoading(false)
      return
    }

    if (!formData.email.includes("@")) {
      setError("Por favor, insira um email válido")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
      setLoading(false)
      return
    }

    if (!formData.acceptTerms) {
      setError("Você deve aceitar os termos de uso")
      setLoading(false)
      return
    }

    try {
      // Simular registro
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast.success("Conta criada com sucesso!")
      router.push("/login")
    } catch (err) {
      setError("Erro ao criar conta. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-linear-to-br from-background via-background to-muted/20">
        <div className="w-full max-w-lg space-y-6 sm:space-y-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-3 bg-linear-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg shadow-blue-600/20">
                <Gauge className="size-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text">
              ColdMonitor
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Comece seu teste gratuito de 30 dias
            </p>
          </div>

          <Card className="border shadow-2xl shadow-black/5">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl sm:text-3xl text-center">Criar nova conta</CardTitle>
              <CardDescription className="text-center text-base">
                Preencha os dados para começar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nome Completo</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 size-4 text-muted-foreground transition-colors group-focus-within:text-blue-600" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-600/20"
                      disabled={loading}
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 size-4 text-muted-foreground transition-colors group-focus-within:text-blue-600" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-600/20"
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium">Empresa</Label>
                  <div className="relative group">
                    <Building className="absolute left-3 top-3 size-4 text-muted-foreground transition-colors group-focus-within:text-blue-600" />
                    <Input
                      id="company"
                      type="text"
                      placeholder="Nome da sua empresa"
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      className="pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-600/20"
                      disabled={loading}
                      autoComplete="organization"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 size-4 text-muted-foreground transition-colors group-focus-within:text-blue-600" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pl-10 pr-10 h-11 transition-all focus:ring-2 focus:ring-blue-600/20"
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4 text-muted-foreground" />
                      ) : (
                        <Eye className="size-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {passwordStrength && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1">
                        <div className={`h-1.5 flex-1 rounded-full transition-colors ${passwordStrength === "weak" ? "bg-red-500" :
                          passwordStrength === "medium" ? "bg-yellow-500" :
                            "bg-green-500"
                          }`} />
                        <div className={`h-1.5 flex-1 rounded-full transition-colors ${passwordStrength === "medium" ? "bg-yellow-500" :
                          passwordStrength === "strong" ? "bg-green-500" :
                            "bg-muted"
                          }`} />
                        <div className={`h-1.5 flex-1 rounded-full transition-colors ${passwordStrength === "strong" ? "bg-green-500" : "bg-muted"
                          }`} />
                      </div>
                      <p className={`text-xs ${passwordStrength === "weak" ? "text-red-600" :
                        passwordStrength === "medium" ? "text-yellow-600" :
                          "text-green-600"
                        }`}>
                        {passwordStrength === "weak" ? "Senha fraca" :
                          passwordStrength === "medium" ? "Senha média" :
                            "Senha forte"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Senha</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 size-4 text-muted-foreground transition-colors group-focus-within:text-blue-600" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repita sua senha"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="pl-10 pr-10 h-11 transition-all focus:ring-2 focus:ring-blue-600/20"
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4 text-muted-foreground" />
                      ) : (
                        <Eye className="size-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {formData.password && formData.confirmPassword && (
                    <p className={`text-xs flex items-center gap-1 ${formData.password === formData.confirmPassword ? "text-green-600" : "text-red-600"
                      }`}>
                      {formData.password === formData.confirmPassword ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Senhas coincidem
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3" />
                          Senhas não coincidem
                        </>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-start space-x-3 pt-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => handleInputChange("acceptTerms", checked as boolean)}
                    disabled={loading}
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm font-normal leading-relaxed cursor-pointer">
                    Aceito os{" "}
                    <Link href="/terms" className="text-blue-600 hover:underline font-medium">
                      termos de uso
                    </Link>{" "}
                    e{" "}
                    <Link href="/privacy" className="text-blue-600 hover:underline font-medium">
                      política de privacidade
                    </Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium bg-blue-600 hover:bg-blue-700 transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Criando sua conta...
                    </>
                  ) : (
                    "Criar conta gratuita"
                  )}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground pt-2">
                Já tem uma conta?{" "}
                <Link href="/auth/sign-in" className="text-blue-600 hover:underline font-medium transition-colors">
                  Faça login
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground flex-wrap px-4">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>Dados seguros</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Sem cartão</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              <span>Setup rápido</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:flex-1 bg-linear-to-br from-blue-600 via-blue-700 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-linear(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="absolute inset-0 bg-[radial-linear(circle_at_70%_80%,rgba(255,255,255,0.05),transparent)]" />

        <div className="relative z-10 flex flex-col justify-center p-12 xl:p-16 text-white max-w-2xl">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium">
                Teste grátis por 30 dias
              </div>
              <h2 className="text-4xl xl:text-5xl font-bold leading-tight text-balance">
                Monitore suas câmaras frias com precisão e confiança
              </h2>
              <p className="text-xl text-blue-100 leading-relaxed">
                Junte-se a centenas de empresas que confiam no ColdMonitor para garantir a qualidade de seus produtos.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Setup rápido</h3>
                  <p className="text-sm text-blue-100">Configure em menos de 5 minutos e comece a monitorar imediatamente</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Alertas em tempo real</h3>
                  <p className="text-sm text-blue-100">Receba notificações instantâneas sobre variações de temperatura</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Conformidade garantida</h3>
                  <p className="text-sm text-blue-100">Atenda normas sanitárias com relatórios completos e auditáveis</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Suporte especializado</h3>
                  <p className="text-sm text-blue-100">Equipe técnica pronta para ajudar quando você precisar</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-sm text-blue-100">
                Mais de <span className="font-bold text-white">500+ empresas</span> confiam no ColdMonitor
              </p>
            </div>
          </div>
        </div>

        <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>
    </div>
  )
}
