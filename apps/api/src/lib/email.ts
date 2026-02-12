import { env } from '@cold-monitor/env'
import { Resend } from 'resend'

export const resend = new Resend(env.EMAIL_API_KEY)

type ResendSendOptions = Parameters<typeof resend.emails.send>[0]

type SendEmailResult =
  | { success: true; id: string }
  | { success: false; message: string }

const maskApiKey = (value: string) =>
  value.length <= 8
    ? '***'
    : `${value.slice(0, 4)}...${value.slice(-4)}`

export async function sendEmailWithValidation(
  options: ResendSendOptions,
  context: string,
): Promise<SendEmailResult> {
  if (!env.EMAIL_API_KEY?.trim()) {
    return {
      success: false,
      message: `[${context}] EMAIL_API_KEY não configurada.`,
    }
  }

  if (!env.EMAIL_API_KEY.startsWith('re_')) {
    return {
      success: false,
      message: `[${context}] EMAIL_API_KEY inválida (prefixo esperado: "re_"). Chave atual: ${maskApiKey(env.EMAIL_API_KEY)}`,
    }
  }

  if (!env.EMAIL_FROM_EMAIL?.trim() || !env.EMAIL_FROM_NAME?.trim()) {
    return {
      success: false,
      message: `[${context}] EMAIL_FROM_EMAIL/EMAIL_FROM_NAME não configurados.`,
    }
  }

  try {
    const result = await resend.emails.send(options as never) as {
      data?: { id?: string } | null
      error?: { message?: string } | string | null
    }

    if (result.error) {
      const message = typeof result.error === 'string'
        ? result.error
        : (result.error.message ?? JSON.stringify(result.error))

      return {
        success: false,
        message: `[${context}] Resend recusou o envio: ${message}`,
      }
    }

    if (!result.data?.id) {
      return {
        success: false,
        message: `[${context}] Resend não retornou id do e-mail.`,
      }
    }

    return {
      success: true,
      id: result.data.id,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      message: `[${context}] Falha ao chamar Resend: ${message}`,
    }
  }
}
