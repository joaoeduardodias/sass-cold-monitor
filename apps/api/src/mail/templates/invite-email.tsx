import * as React from 'react';

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
  Text,
} from '@react-email/components';

interface InviteEmailProps {
  recipientName?: string;
  invitedByName?: string;
  invitedByEmail?: string;
  inviteLink?: string;
  inviteFromIp?: string;
  inviteFromLocation?: string;
}

const appUrl = process.env.APP_URL ? `https://${process.env.APP_URL}` : '';

export const InviteEmail = ({
  recipientName = 'usuário',
  invitedByName = 'Equipe Cold Monitor',
  invitedByEmail = 'suporte@coldmonitor.com',
  inviteLink = `${appUrl}/auth/sign-up`,

}: InviteEmailProps) => {
  const previewText = `${invitedByName} enviou um convite para você acessar o Cold Monitor`;

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
                Você recebeu um convite
              </Text>
              <Hr className="border-[#e6ebf1] my-5" />
              <Text className="text-slate-600 text-base leading-6 text-left">
                Olá {recipientName},
              </Text>
              <Text className="text-slate-600 text-base leading-6 text-left">
                <strong>{invitedByName}</strong> (
                <a
                  href={`mailto:${invitedByEmail}`}
                  className="text-blue-600 no-underline"
                >
                  {invitedByEmail}
                </a>
                ) convidou você para acessar o sistema <strong>Cold Monitor</strong>.
              </Text>
              <Text className="text-center text-slate-600 text-base leading-6">
                Clique no botão abaixo para aceitar o convite e entrar no painel.
              </Text>
              <Button
                className="bg-blue-600 rounded text-white text-base font-bold no-underline text-center block w-full p-2.5"
                href={inviteLink}
              >
                Aceitar convite
              </Button>
              <Text className="text-slate-600 text-sm leading-6 text-left mt-5">
                Se o botão acima não funcionar, copie e cole este link no navegador:
              </Text>
              <Text className="text-blue-600 text-sm leading-6 break-all text-left">
                {inviteLink}
              </Text>

            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

InviteEmail.PreviewProps = {
  recipientName: 'João',
  invitedByName: 'Ana Souza',
  invitedByEmail: 'ana@coldmonitor.com',
  inviteLink: `${appUrl}/invite/abc123`,
} as InviteEmailProps;

export default InviteEmail;
