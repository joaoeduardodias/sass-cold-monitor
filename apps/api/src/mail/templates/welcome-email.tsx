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
  Text
} from '@react-email/components';

export const WelcomeEmail = () => (
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
        <Preview>Você acaba de criar uma conta no nosso sistema, bem vindo!</Preview>
        <Container className="px-2">
          <Section className="px-12">
            <Text className="text-2xl text-center font-bold text-blue-600">
              Cold Monitor
            </Text>
            <Text className="text-xl text-center text-gray-800">
              Bem-vindo ao nosso sistema!
            </Text>
            <Hr className="border-[#e6ebf1] my-5" />
            <Text className="text-slate-600 text-base leading-6 text-left">
              Muito obrigado por criar uma conta no nosso sistema, estamos muito felizes em tê-lo conosco.
              Esperamos que você aproveite ao máximo os recursos e funcionalidades que oferecemos.
              Se tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.
              Estamos sempre aqui para ajudar!
            </Text>
            <Text className="text-center text-slate-600 text-base leading-6">
              Clique no botão abaixo para acessar o painel do Cold Monitor e começar a usar o sistema.
            </Text>
            <Button
              className="bg-blue-600 rounded text-white text-base font-bold no-underline text-center block w-full p-2.5"
              href={`${process.env.APP_URL}/auth/sign-in`}>
              Acessar Painel
            </Button>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default WelcomeEmail;
