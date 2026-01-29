"use server"

import z from "zod"

const forgotPasswordSchema = z.object({
  email: z.email("Informe um email válido"),
})

export async function forgotPasswordAction(formData: FormData) {
  const result = forgotPasswordSchema.safeParse(
    Object.fromEntries(formData),
  )

  if (!result.success) {
    return {
      success: false,
      message: null,
      errors: result.error.flatten().fieldErrors,
    }
  }

  const { email } = result.data

  try {
    // 🔐 Envio real do email entra aqui
    await new Promise((resolve) => setTimeout(resolve, 1500))
  } catch {
    return {
      success: false,
      message:
        "Erro encontrado. Por favor, tente novamente mais tarde.",
      errors: null,
    }
  }

  return {
    success: true,
    message: null,
    errors: null,
  }
}
