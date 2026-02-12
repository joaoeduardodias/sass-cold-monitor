"use server"

import { signInWithPassword } from "@/http/users/sign-in-with-password";
import { HTTPError } from "ky";
import { cookies } from "next/headers";
import z from "zod/v4";

const signInSchema = z.object({
  email: z.email("Por favor, insira um email válido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
})

export async function signInAction(data: FormData) {
  const result = signInSchema.safeParse(Object.fromEntries(data));

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    return { success: false, message: null, errors }
  };


  const { email, password } = result.data

  try {
    const { token } = await signInWithPassword({ email, password });
    const cookieStore = await cookies()
    cookieStore.set("token", token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
  }
  catch (err: any) {
    if (err instanceof HTTPError) {
      const { message } = await err.response.json()
      return { success: false, message, errors: null };
    }
    return {
      success: false,
      message: 'Erro encontrado. Tente novamente mais tarde.',
      errors: null
    }
  }
  return {
    success: true,
    message: null,
    errors: null
  }
}
