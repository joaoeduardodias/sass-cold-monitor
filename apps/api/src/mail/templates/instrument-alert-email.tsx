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
import { formatEmailDateTime } from '@/utils/format-email-date-time';

interface InstrumentAlertEmailProps {
  chamberName?: string;
  alertType?: string;
  currentValue?: string;
  limitValue?: string;
  timestamp?: string;
}

export const InstrumentAlertEmail = ({
  chamberName = 'Câmara Principal',
  alertType = 'Temperatura Alta',
  currentValue = '-18.2 °C',
  limitValue = '-20.0 °C',
  timestamp = '2026-02-11T14:35:00.000Z',
}: InstrumentAlertEmailProps) => {
  const previewText = `Alerta ColdMonitor - ${chamberName} - ${alertType}`;
  const formattedTimestamp = formatEmailDateTime(timestamp);

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
                Alerta Cold Monitor
              </Text>
              <Hr className="border-[#e6ebf1] my-5" />
              <Text className="text-slate-700 text-base leading-7 text-left">
                <strong>Câmara:</strong> {chamberName}
                <br />
                <strong>Tipo:</strong> {alertType}
                <br />
                <strong>Valor:</strong> {currentValue}
                <br />
                <strong>Limite:</strong> {limitValue}
                <br />
                <strong>Data/Hora:</strong> {formattedTimestamp}
              </Text>
              <Hr className="border-[#e6ebf1] my-5" />
              <Text className="text-slate-700 text-base leading-6 text-center font-semibold">
                Verifique o sistema imediatamente.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

InstrumentAlertEmail.PreviewProps = {
  chamberName: 'Câmara 01',
  alertType: 'Temperatura Alta',
  currentValue: '-15.4 °C',
  limitValue: '-20.0 °C',
  timestamp: '2026-02-11T14:35:00.000Z',
} as InstrumentAlertEmailProps;

export default InstrumentAlertEmail;
