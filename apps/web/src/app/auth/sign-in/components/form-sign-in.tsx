"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFormState } from "@/hooks/use-form-state"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"

import { ButtonGoogle } from "@/components/button-google"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { signInAction } from "../actions"

export function FormSignIn() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const [{ success, message, errors }, handleSubmit, isPending] =
    useFormState(signInAction, () => {
      router.push("/select-organization")
    })

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        {success === false && message && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Falha no login</AlertTitle>
            <AlertDescription>
              <p>{message}</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="text"
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
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="••••••••"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

        <div className="flex items-center justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Entrando
            </>
          ) : (
            "Entrar"
          )}
        </Button>
        <ButtonGoogle isPending={isPending} />
        <div className="text-center text-sm text-gray-600">
          Não tem uma conta?{" "}
          <Link
            href="/auth/sign-up"
            className="text-blue-600 hover:underline font-medium"
          >
            Criar conta
          </Link>
        </div>
      </CardFooter>
    </form>
  )
}
