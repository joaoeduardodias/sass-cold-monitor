"use server"

import { signUp } from "@/http/sign-up"
import { HTTPError } from "ky"
import { cookies } from "next/headers"
import z from "zod/v4"

const signUpSchema = z
  .object({
    name: z.string().refine(
      (value) => value.trim().split(" ").length >= 2,
      "Por favor insira seu nome completo",
    ),
    email: z.email("Por favor, insira um email válido"),
    password: z
      .string()
      .min(6, "A senha deve ter no mínimo 6 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número",
      ),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "As senhas não coincidem",
    path: ["passwordConfirmation"],
  })

export async function signUpAction(data: FormData) {
  const result = signUpSchema.safeParse(Object.fromEntries(data))

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    return { success: false, message: null, errors }
  }

  const { name, email, password } = result.data

  try {
    const response = await signUp({ email, name, password })

    const token = response.token
    const cookieStore = await cookies()
    cookieStore.set("token", token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

  } catch (err: any) {
    if (err instanceof HTTPError) {
      const { message } = await err.response.json()
      return { success: false, message, errors: null }
    }

    return {
      success: false,
      message: "Erro encontrado. Por favor, tente novamente mais tarde.",
      errors: null,
    }
  }
  return { success: true, message: null, errors: null }
}
