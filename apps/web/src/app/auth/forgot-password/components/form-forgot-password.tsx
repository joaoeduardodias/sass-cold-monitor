"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFormState } from "@/hooks/use-form-state"

import { ArrowLeft, CheckCircle, Loader2, Mail } from "lucide-react"
import Link from "next/link"
import { forgotPasswordAction } from "../actions"

export function FormForgotPassword() {
  const [{ success, message, errors }, handleSubmit, isPending] =
    useFormState(forgotPasswordAction)

  if (success) {
    return (
      <CardContent className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="p-3 bg-green-600 rounded-full">
            <CheckCircle className="size-8 text-white" />
          </div>
        </div>

        <Alert>
          <AlertTitle>Email enviado</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>

        <Button asChild className="w-full">
          <Link href="/auth/sign-in">
            <ArrowLeft className="mr-2 size-4" />
            Voltar ao login
          </Link>
        </Button>
      </CardContent>
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        {success === false && message && (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>

          <div className="relative">
            <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />

            <Input
              id="email"
              name="email"
              placeholder="seu@email.com"
              className="pl-10"
            />
          </div>

          {errors?.email && (
            <p className="text-xs ml-1 text-red-600">
              {errors.email[0]}
            </p>
          )}
        </div>
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
              Enviando...
            </>
          ) : (
            "Enviar link de recuperação"
          )}
        </Button>

        <Link
          href="/auth/sign-in"
          className="text-sm text-muted-foreground hover:underline inline-flex items-center"
        >
          <ArrowLeft className="mr-1 size-3" />
          Voltar ao login
        </Link>
      </CardFooter>
    </form>
  )
}
