import * as React from 'react'

import { env } from '@cold-monitor/env';
import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text
} from '@react-email/components'

type WelcomeEmailProps = {
  userName?: string
  organizationName?: string
  organizationSlug?: string
}

export const WelcomeEmail = ({
  userName = 'usuário',
  organizationName = 'sua empresa',
  organizationSlug,
}: WelcomeEmailProps) => {
  const organizationLink = organizationSlug
    ? `${env.NEXT_PUBLIC_APP_URL}/org/${organizationSlug}`
    : `${env.NEXT_PUBLIC_APP_URL}/select-organization`

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Tailwind>
        <Body>
          <Preview>Sua empresa {organizationName} foi criada com sucesso no Cold Monitor</Preview>
          <Container className="px-2">
            <Section className="px-12">
              <Text className="text-2xl text-center font-bold text-blue-600">
                Cold Monitor
              </Text>
              <Text className="text-xl text-center text-gray-800">
                Empresa criada com sucesso
              </Text>
              <Hr className="border-[#e6ebf1] my-5" />
              <Text className="text-slate-600 text-base leading-6 text-left">
                Olá {userName},
              </Text>
              <Text className="text-slate-600 text-base leading-6 text-left">
                A empresa <strong>{organizationName}</strong> foi criada com sucesso e já está pronta para uso no Cold
                Monitor.
              </Text>
              <Text className="text-slate-600 text-base leading-6 text-left">
                Agora você já pode acessar o painel, configurar o coletor, cadastrar instrumentos e começar o
                monitoramento.
              </Text>
              <Text className="text-center text-slate-600 text-base leading-6">
                Clique no botão abaixo para abrir a sua nova empresa.
              </Text>
              <Button
                className="bg-blue-600 rounded text-white text-base font-bold no-underline text-center block w-full p-2.5"
                href={organizationLink}>
                Acessar empresa
              </Button>
              <Text className="text-slate-600 text-sm leading-6 text-left mt-5">
                Se o botão acima não funcionar, copie e cole este link no navegador:
              </Text>
              <Text className="text-blue-600 text-sm leading-6 break-all text-left">
                {organizationLink}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

WelcomeEmail.PreviewProps = {
  userName: 'João',
  organizationName: 'Frigorífico Central',
  organizationSlug: 'frigorifico-central',
} as WelcomeEmailProps

export default WelcomeEmail
