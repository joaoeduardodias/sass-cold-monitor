"use server"

import { updateProfile } from "@/http/users/update-profile"
import { HTTPError } from "ky"
import z from "zod/v4"

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres"),
  email: z.email("Informe um e-mail válido").trim(),
  avatarUrl: z.string().trim().optional(),
})

export async function updateProfileAction(data: FormData) {
  const parsed = updateProfileSchema.safeParse(Object.fromEntries(data))

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    return {
      success: false,
      message: null,
      errors,
    }
  }

  const { name, email, avatarUrl } = parsed.data

  if (avatarUrl && !z.url().safeParse(avatarUrl).success) {
    return {
      success: false,
      message: null,
      errors: {
        avatarUrl: ["Informe uma URL válida para a foto"],
      },
    }
  }

  try {
    await updateProfile({
      name,
      email: email.toLowerCase(),
      avatarUrl: avatarUrl ? avatarUrl : null,
    })

    return {
      success: true,
      message: "Perfil atualizado com sucesso.",
      errors: null,
    }
  } catch (err: any) {
    if (err instanceof HTTPError) {
      const { message } = await err.response.json()
      return {
        success: false,
        message,
        errors: null,
      }
    }

    return {
      success: false,
      message: "Não foi possível salvar seu perfil.",
      errors: null,
    }
  }
}
