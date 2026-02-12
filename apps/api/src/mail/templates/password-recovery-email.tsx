import * as React from 'react';

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
} from '@react-email/components';

interface PasswordRecoveryEmailProps {
  recipientName?: string;
  code?: string;
}

export const PasswordRecoveryEmail = ({
  recipientName = 'usuário',
  code = '123456',
}: PasswordRecoveryEmailProps) => {
  const previewText = `Seu código de recuperação no Cold Monitor: ${code}`;

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
                Recuperação de senha
              </Text>
              <Hr className="border-[#e6ebf1] my-5" />
              <Text className="text-slate-600 text-base leading-6 text-left">
                Olá {recipientName},
              </Text>
              <Text className="text-slate-600 text-base leading-6 text-left">
                Recebemos uma solicitação para redefinir sua senha. Use o código
                abaixo para continuar:
              </Text>
              <Text className="text-center text-blue-700 text-3xl font-bold tracking-[0.3em] my-6">
                {code}
              </Text>
              <Text className="text-slate-600 text-sm leading-6 text-left">
                Se você não solicitou a recuperação de senha, ignore este e-mail.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

PasswordRecoveryEmail.PreviewProps = {
  recipientName: 'João',
  code: '748219',
} as PasswordRecoveryEmailProps;

export default PasswordRecoveryEmail;
