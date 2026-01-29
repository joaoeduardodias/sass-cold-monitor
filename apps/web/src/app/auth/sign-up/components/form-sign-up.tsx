"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFormState } from "@/hooks/use-form-state"

import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { signUpAction } from "../actions"


export function FormSignUp() {
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [{ success, message, errors }, handleSubmit, isPending] =
    useFormState(signUpAction, () => {
      // router.push("/auth/sign-in")
      router.push("/")
    })

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        {success === false && message && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Cadastro falhou</AlertTitle>
            <AlertDescription>
              <p>{message}</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            name="name"
            placeholder="Seu nome completo"
          />
          {errors?.name && (
            <p className="text-xs ml-1 text-red-600">
              {errors.name[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            placeholder="seu@email.com"
          />
          {errors?.email && (
            <p className="text-xs ml-1 text-red-600">
              {errors.email[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? (
                <Eye className="size-4" />
              ) : (
                <EyeOff className="size-4" />
              )}
            </button>
          </div>

          {errors?.password && (
            <p className="text-xs ml-1 text-red-600">
              {errors.password[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Confirmar senha
          </Label>

          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showConfirmPassword ? (
                <Eye className="size-4" />
              ) : (
                <EyeOff className="size-4" />
              )}
            </button>
          </div>

          {errors?.confirmPassword && (
            <p className="text-xs ml-1 text-red-600">
              {errors.confirmPassword[0]}
            </p>
          )}
        </div>

        <div className="flex items-start justify-center space-x-3">
          <Checkbox id="terms" name="acceptTerms" />
          <Label
            htmlFor="terms"
            className="text-sm leading-relaxed"
          >
            Aceito os{" "}
            <Link href="/terms" className="underline">
              termos de uso
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="underline">
              política de privacidade
            </Link>
          </Label>
        </div>

        {errors?.acceptTerms && (
          <p className="text-xs ml-1 text-red-600">
            {errors.acceptTerms[0]}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Criar conta"
          )}
        </Button>

        <div className="text-center text-sm text-gray-600">
          Já possui conta?{" "}
          <Link
            href="/auth/sign-in"
            className="font-medium underline"
          >
            Fazer login
          </Link>
        </div>
      </CardFooter>
    </form>
  )
}
