export const DEFAULT_EMAIL_TEMPLATE = `Alerta ColdMonitor

Câmara: {chamber_name}
Tipo: {alert_type}
Valor: {current_value}
Limite: {limit_value}
Data/Hora: {timestamp}

Verifique o sistema imediatamente.`

export const DEFAULT_NOTIFICATION_SETTINGS = {
  emailEnabled: true,
  emailRecipients: [] as string[],
  pushEnabled: true,
  criticalAlerts: true,
  warningAlerts: true,
  emailTemplate: DEFAULT_EMAIL_TEMPLATE,
}

export type AlertType = 'critical' | 'warning'

export function isAlertTypeEnabled(
  alertType: AlertType,
  settings: {
    criticalAlerts: boolean
    warningAlerts: boolean
  },
) {
  if (alertType === 'critical') return settings.criticalAlerts
  return settings.warningAlerts
}
