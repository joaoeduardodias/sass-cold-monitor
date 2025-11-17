"use client"

import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Activity, AlertCircle, Eye, EyeOff, Gauge, Loader2, Lock, Mail, Thermometer, Wind } from 'lucide-react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useState } from "react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.email || !formData.password) {
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
      setError("A senha deve ter no mínimo 6 caracteres")
      setLoading(false)
      return
    }

    try {
      // Simular autenticação
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simular diferentes cenários de login
      if (formData.email === "admin@coldmonitor.com" && formData.password === "admin123") {
        toast.success("Login realizado com sucesso!", {
          description: "Redirecionando para o painel...",
        })
        setTimeout(() => router.push("/"), 500)
      } else if (formData.email === "demo@coldmonitor.com" && formData.password === "demo123") {
        toast.success("Bem-vindo ao modo demonstração!", {
          description: "Acesso limitado ao modo demo",
        })
        setTimeout(() => router.push("/"), 500)
      } else {
        setError("Email ou senha incorretos. Verifique suas credenciais e tente novamente.")
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor. Tente novamente em alguns instantes.")
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    setFormData({
      email: "demo@coldmonitor.com",
      password: "demo123",
      rememberMe: false,
    })
    toast.info("Credenciais de demonstração preenchidas", {
      description: "Clique em 'Entrar' para acessar",
    })
  }

  const handleAdminLogin = () => {
    setFormData({
      email: "admin@coldmonitor.com",
      password: "admin123",
      rememberMe: false,
    })
    toast.info("Credenciais de administrador preenchidas", {
      description: "Clique em 'Entrar' para acessar",
    })
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-background">
        <div className="w-full max-w-[480px] space-y-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-3 bg-linear-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
                <Gauge className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">ColdMonitor</h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Sistema de Monitoramento de Câmaras Frias
            </p>
          </div>

          <Card className="border-2 shadow-xl">
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="text-2xl sm:text-3xl text-center font-bold">Entrar</CardTitle>
              <CardDescription className="text-center leading-relaxed">
                Digite suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm leading-relaxed">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10 h-11 transition-all focus:ring-2"
                      disabled={loading}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pl-10 pr-10 h-11 transition-all focus:ring-2"
                      disabled={loading}
                      autoComplete="current-password"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 p-0 hover:bg-muted"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
                      disabled={loading}
                    />
                    <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                      Lembrar de mim
                    </Label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium bg-blue-600 hover:bg-blue-700 transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground font-medium">Acesso rápido</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="w-full h-11 border-2 hover:bg-muted transition-all"
                  onClick={handleDemoLogin}
                  disabled={loading}
                >
                  <Gauge className="mr-2 h-4 w-4" />
                  Demo
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11 border-2 hover:bg-muted transition-all"
                  onClick={handleAdminLogin}
                  disabled={loading}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Admin
                </Button>
              </div>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Não tem uma conta? </span>
                <Link href="/auth/sign-up" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                  Cadastre-se gratuitamente
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-1 rounded-full bg-blue-600" />
                <h3 className="font-semibold text-sm">Credenciais de Teste</h3>
              </div>
              <div className="space-y-2 text-sm">
                <button
                  onClick={handleAdminLogin}
                  className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors text-left group"
                  disabled={loading}
                >
                  <span className="text-muted-foreground">Admin:</span>
                  <span className="font-mono text-xs group-hover:text-blue-600 transition-colors">
                    admin@coldmonitor.com
                  </span>
                </button>
                <button
                  onClick={handleDemoLogin}
                  className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors text-left group"
                  disabled={loading}
                >
                  <span className="text-muted-foreground">Demo:</span>
                  <span className="font-mono text-xs group-hover:text-blue-600 transition-colors">
                    demo@coldmonitor.com
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden lg:flex lg:flex-1 bg-linear-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-black/20 to-black/40" />

        <div className="absolute top-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse delay-500" />

        <div className="relative z-10 flex flex-col justify-center p-12 xl:p-16 text-white max-w-2xl">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">Monitoramento Inteligente</span>
              </div>
              <h2 className="text-4xl xl:text-5xl font-bold leading-tight text-balance">
                Monitore suas câmaras frias com precisão absoluta
              </h2>
              <p className="text-lg xl:text-xl text-blue-50 leading-relaxed">
                Controle temperatura, pressão e umidade em tempo real. Receba alertas instantâneos e mantenha seus
                produtos sempre seguros e dentro das normas.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                <div className="shrink-0 w-10 h-10 bg-green-400/20 rounded-lg flex items-center justify-center">
                  <Thermometer className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Monitoramento 24/7 em tempo real</h3>
                  <p className="text-sm text-blue-100 leading-relaxed">
                    Acompanhe todas as métricas com atualização instantânea
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                <div className="shrink-0 w-10 h-10 bg-green-400/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Alertas automáticos inteligentes</h3>
                  <p className="text-sm text-blue-100 leading-relaxed">
                    Notificações por email, SMS e push quando algo sair do normal
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                <div className="shrink-0 w-10 h-10 bg-green-400/20 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Histórico completo e relatórios</h3>
                  <p className="text-sm text-blue-100 leading-relaxed">
                    Gere relatórios detalhados e mantenha conformidade regulatória
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                <div className="shrink-0 w-10 h-10 bg-green-400/20 rounded-lg flex items-center justify-center">
                  <Wind className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Controles operacionais remotos</h3>
                  <p className="text-sm text-blue-100 leading-relaxed">
                    Ajuste parâmetros e gerencie equipamentos de qualquer lugar
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 pt-4 border-t border-white/20">
              <div>
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-sm text-blue-100">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-blue-100">Suporte</div>
              </div>
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-blue-100">Clientes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
