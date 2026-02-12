import * as React from 'react'

import {
  Body,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import { formatEmailDateTime } from '@/utils/format-email-date-time'

type TestSendEmailProps = {
  organizationName?: string
  sentAt?: string
}

export function TestSendEmail({
  organizationName = 'sua organização',
  sentAt = new Date().toISOString(),
}: TestSendEmailProps) {
  const previewText = `Teste de envio de e-mail - ${organizationName}`
  const formattedSentAt = formatEmailDateTime(sentAt)

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Tailwind>
        <Body>
          <Preview>{previewText}</Preview>
          <Container className="px-2">
            <Section className="px-12">
              <Text className="text-2xl text-center font-bold text-blue-600">
                Cold Monitor
              </Text>
              <Text className="text-xl text-center text-gray-800">
                Teste de envio realizado
              </Text>
              <Hr className="border-[#e6ebf1] my-5" />
              <Text className="text-slate-600 text-base leading-6 text-left">
                Este é um e-mail de teste das configurações de notificações.
              </Text>
              <Text className="text-slate-600 text-base leading-6 text-left">
                Organização: <strong>{organizationName}</strong>
              </Text>
              <Text className="text-slate-600 text-base leading-6 text-left">
                Enviado em: <strong>{formattedSentAt}</strong>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default TestSendEmail
