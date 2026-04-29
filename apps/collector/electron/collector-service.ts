import axios from 'axios'
import log from 'electron-log'
import https from 'https'
import WebSocket from 'ws'
import { WS_URL } from './constants'
import { getCollectorConfig, setCollectorConfig } from './config-store'
import { resolveCollectorConfig } from './device-auth'
import { getInstrumentsWithValues } from './functions-instrument'
import { store } from './store'
import { createSlug } from './utils/create-slug'
import { getProcessStatus } from './utils/get-process-status'
import { setTray } from './window-tray'

let socket: WebSocket | null = null
let reconnectTimeout: NodeJS.Timeout | null = null
let isSocketAuthenticated = false
let collectorRunId = 0
let runtimeEventHandler: ((event: CollectorRuntimeEvent) => void) | null = null
let shouldReconnect = false

let instrumentMapping: Record<string, string> = {}
const commandOverridesBySitradId = new Map<number, {
  forceDefrost?: boolean
  forceFan?: boolean
  setPoint?: number
  differential?: number
}>()
const httpsAgent = new https.Agent({ rejectUnauthorized: false })

type InstrumentCommandAction = 'SET_DEFROST' | 'SET_FAN' | 'SET_SETPOINT' | 'SET_DIFFERENTIAL'

type WsOutgoingMessage =
  | {
    type: 'AUTH'
    payload: {
      organizationId?: string
      token: string
      deviceToken: string
    }
  }
  | {
    type: 'INSTRUMENT_CREATE'
    payload: {
      idSitrad: number
      name: string
      slug: string
      model: number
      type: 'PRESSURE' | 'TEMPERATURE'
      organizationId: string
    }[]
  }
  | {
    type: 'INSTRUMENT_READING'
    payload: {
      idSitrad: number;
      name: string;
      slug: string;
      model: number;
      type: "TEMPERATURE" | "PRESSURE";
      error: boolean;
      value: number | undefined;
      status: string;
      setPoint: number | undefined;
      differential: number | undefined;
      isSensorError: boolean | undefined;
      organizationId: string;
    }[]
  }

type WsIncomingMessage =
  | {
    type: 'AUTH_OK'
    organizationId?: string
    organization_id?: string
    userId?: string
    user_id?: string
    token?: string
    deviceToken?: string
    device_token?: string
    stopPassword?: string
    payload?: {
      organizationId?: string
      organization_id?: string
      userId?: string
      user_id?: string
      token?: string
      deviceToken?: string
      device_token?: string
      stopPassword?: string
    }
  }
  | { type: 'AUTH_ERROR'; message?: string }
  | { type: 'AGENT_ALREADY_RUNNING'; message?: string }
  | { type: 'INSTRUMENT_CREATED'; payload: { id: string; slug: string }[] }
  | {
    type: 'INSTRUMENT_COMMAND'
    payload: {
      instrumentId: string
      idSitrad: number | null
      modelId?: number | null
      action: InstrumentCommandAction
      value: boolean | number
      timestamp: string
    }
  }

export type CollectorRuntimeEvent = {
  status: 'running' | 'stopped' | 'error'
  message: string
  code?: 'AGENT_ALREADY_RUNNING'
}

export type CollectorStartResult =
  | { success: true }
  | { success: false; error: string }

export function setCollectorRuntimeEventHandler(handler: ((event: CollectorRuntimeEvent) => void) | null) {
  runtimeEventHandler = handler
}

function emitRuntimeEvent(event: CollectorRuntimeEvent) {
  runtimeEventHandler?.(event)
}

function isAgentAlreadyRunningMessage(message?: string): boolean {
  if (!message) return false

  return /(already.*(agent|collector).*(running|online))|(organization.*already.*running)|(ja.*(agente|coletor).*(rodando|executando))/i
    .test(message.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
}

function sendWsMessage(message: WsOutgoingMessage): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) return
  socket.send(JSON.stringify(message))
}

function closeCurrentSocket({ reconnect = false }: { reconnect?: boolean } = {}): void {
  shouldReconnect = reconnect

  if (!socket) return

  socket.removeAllListeners('open')
  socket.removeAllListeners('message')
  socket.removeAllListeners('close')
  socket.removeAllListeners('error')
  socket.close()
  socket = null
}

function resolveAuthOkPayload(
  msg: Extract<WsIncomingMessage, { type: 'AUTH_OK' }>,
): NonNullable<Extract<WsIncomingMessage, { type: 'AUTH_OK' }>['payload']> {
  return {
    organizationId: msg.payload?.organizationId ?? msg.organizationId,
    organization_id: msg.payload?.organization_id ?? msg.organization_id,
    userId: msg.payload?.userId ?? msg.userId,
    user_id: msg.payload?.user_id ?? msg.user_id,
    token: msg.payload?.token ?? msg.token,
    deviceToken: msg.payload?.deviceToken ?? msg.deviceToken,
    device_token: msg.payload?.device_token ?? msg.device_token,
    stopPassword: msg.payload?.stopPassword ?? msg.stopPassword,
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isInstrumentCommandAction(value: unknown): value is InstrumentCommandAction {
  return value === 'SET_DEFROST'
    || value === 'SET_FAN'
    || value === 'SET_SETPOINT'
    || value === 'SET_DIFFERENTIAL'
}

function resolveDifferentialFunctionCode(model?: number | null): 'F02' | 'F05' | null {
  if (model === 72) return 'F02'
  if (model === 73) return 'F05'
  return null
}

async function postToSitradInstrumentEndpoint(
  id: number,
  endpoint: 'commands' | 'functions',
  dataBody: Record<string, unknown>,
): Promise<void> {
  const config = getCollectorConfig()
  if (!config?.sitradUrl || !config.username || !config.password) {
    log.warn(`Skipping Sitrad ${endpoint} call for idSitrad=${id}: missing Sitrad credentials in store config`)
    return
  }

  const base = config.sitradUrl.replace(/\/+$/, '')
  await axios.post(
    `${base}/instruments/${id}/${endpoint}`,
    dataBody,
    {
      auth: { username: config.username, password: config.password },
      httpsAgent,
      timeout: 8000,
    },
  )
}

async function setSitradDifferential(id: number, differential: number, model?: number | null): Promise<void> {
  const code = resolveDifferentialFunctionCode(model)
  if (!code) {
    log.warn(`Skipping SET_DIFFERENTIAL for idSitrad=${id}: unsupported model=${model ?? 'unknown'}`)
    return
  }

  const dataBody = {
    code,
    value: differential,
    showSpc: true,
  }

  await postToSitradInstrumentEndpoint(id, 'functions', dataBody)
}

async function setSitradDefrost(id: number, active: boolean, model?: number | null): Promise<void> {
  let dataBody: Record<string, unknown> | null = null

  if (model === 73) {
    dataBody = {
      code: 'INV',
      value: active ? 0 : 1,
      groupCode: null,
      showSpc: true,
    }
  } else if (model === 72) {
    dataBody = {
      code: 'DEFR',
      value: 0,
      groupCode: null,
      showSpc: true,
    }
  }

  if (!dataBody) {
    log.warn(`Skipping SET_DEFROST for idSitrad=${id}: unsupported model=${model ?? 'unknown'}`)
    return
  }

  await postToSitradInstrumentEndpoint(id, 'commands', dataBody)
}

async function setSitradFan(id: number, active: boolean, model?: number | null): Promise<void> {
  if (model !== 72) {
    log.warn(`Skipping SET_FAN for idSitrad=${id}: unsupported model=${model ?? 'unknown'}`)
    return
  }

  const dataBody = {
    code: 'F21',
    value: active ? 7 : 4,
    showSpc: true,
  }

  await postToSitradInstrumentEndpoint(id, 'functions', dataBody)
}

function resolveSetpointFunctionCode(model?: number | null): 'F31' | 'SET' | 'F01' {
  if (model === 72) return 'F31'
  if (model === 73) return 'SET'
  return 'F01'
}

async function setSitradSetpoint(id: number, setpoint: number, model?: number | null): Promise<void> {
  const dataBody = {
    code: resolveSetpointFunctionCode(model),
    value: setpoint,
    showSpc: true,
  }

  await postToSitradInstrumentEndpoint(id, 'functions', dataBody)
}

async function applyInstrumentCommand(
  payload: Extract<WsIncomingMessage, { type: 'INSTRUMENT_COMMAND' }>['payload'],
): Promise<void> {
  if (typeof payload.idSitrad !== 'number') {
    log.warn(`Ignoring INSTRUMENT_COMMAND without idSitrad for instrumentId=${payload.instrumentId}`)
    return
  }

  const previous = commandOverridesBySitradId.get(payload.idSitrad) ?? {}
  const next = { ...previous }

  if (payload.action === 'SET_DEFROST' && typeof payload.value === 'boolean') {
    next.forceDefrost = payload.value
  }

  if (payload.action === 'SET_FAN' && typeof payload.value === 'boolean') {
    next.forceFan = payload.value
  }

  if (payload.action === 'SET_SETPOINT' && typeof payload.value === 'number') {
    next.setPoint = payload.value
  }

  if (payload.action === 'SET_DIFFERENTIAL' && typeof payload.value === 'number') {
    next.differential = payload.value
  }

  commandOverridesBySitradId.set(payload.idSitrad, next)

  if (payload.action === 'SET_DIFFERENTIAL' && typeof payload.value === 'number') {
    const model = payload.modelId
    try {
      await setSitradDifferential(payload.idSitrad, payload.value, model)
    } catch (err) {
      log.error(
        `Failed to apply SET_DIFFERENTIAL in Sitrad idSitrad=${payload.idSitrad} model=${model ?? 'unknown'}:`,
        err,
      )
    }
  }

  if (payload.action === 'SET_DEFROST' && typeof payload.value === 'boolean') {
    const model = payload.modelId
    try {
      await setSitradDefrost(payload.idSitrad, payload.value, model)
    } catch (err) {
      log.error(
        `Failed to apply SET_DEFROST in Sitrad idSitrad=${payload.idSitrad} model=${model ?? 'unknown'}:`,
        err,
      )
    }
  }

  if (payload.action === 'SET_FAN' && typeof payload.value === 'boolean') {
    const model = payload.modelId
    try {
      await setSitradFan(payload.idSitrad, payload.value, model)
    } catch (err) {
      log.error(
        `Failed to apply SET_FAN in Sitrad idSitrad=${payload.idSitrad} model=${model ?? 'unknown'}:`,
        err,
      )
    }
  }

  if (payload.action === 'SET_SETPOINT' && typeof payload.value === 'number') {
    const model = payload.modelId
    try {
      await setSitradSetpoint(payload.idSitrad, payload.value, model)
    } catch (err) {
      log.error(
        `Failed to apply SET_SETPOINT in Sitrad idSitrad=${payload.idSitrad} model=${model ?? 'unknown'}:`,
        err,
      )
    }
  }

  log.info(`INSTRUMENT_COMMAND received action=${payload.action} idSitrad=${payload.idSitrad}`)
}

function applyCommandOverridesToSnapshot(inst: Awaited<ReturnType<typeof getInstrumentsWithValues>>[number]) {
  const override = commandOverridesBySitradId.get(inst.id)
  if (!override) return inst

  return {
    ...inst,
    IsDefrost: override.forceDefrost ?? inst.IsDefrost,
    IsOutputDefr1: override.forceDefrost ?? inst.IsOutputDefr1,
    IsOutputFan: override.forceFan ?? inst.IsOutputFan,
    CurrentSetpoint: override.setPoint ?? inst.CurrentSetpoint,
    FncSetpoint: override.setPoint ?? inst.FncSetpoint,
    Setpoint1RelativeTemp: override.setPoint ?? inst.Setpoint1RelativeTemp,
    CurrentDifferential: override.differential ?? inst.CurrentDifferential,
    FncDifferential: override.differential ?? inst.FncDifferential,
  }
}

function mapInstrumentsForCreate(instruments: Awaited<ReturnType<typeof getInstrumentsWithValues>>, organizationId: string) {
  return instruments.map(inst => ({
    idSitrad: inst.id,
    name: inst.name,
    slug: createSlug(inst.name),
    model: inst.modelId ?? 0,
    type: inst.modelId === 67 ? 'PRESSURE' as const : 'TEMPERATURE' as const,
    organizationId,
  }))
}

function mapInstrumentsForReading(instruments: Awaited<ReturnType<typeof getInstrumentsWithValues>>, organizationId: string) {
  function resolveInstrumentValue(inst: any) {
    switch (inst.modelId) {
      case 67:
        return inst.GasPressure ?? 0

      case 73:
      case 78:
        return inst.Temperature ?? 0

      default:
        return inst.Sensor1 ?? 0
    }
  }

  return instruments.map((rawInst) => {
    const inst = applyCommandOverridesToSnapshot(rawInst)

    return {
      idSitrad: inst.id,
      name: inst.name,
      slug: createSlug(inst.name),
      model: inst.modelId ?? 0,
      type: inst.modelId === 67 ? 'PRESSURE' as const : 'TEMPERATURE' as const,
      value: resolveInstrumentValue(inst),
      status: getProcessStatus(inst),
      setPoint: Number(inst.modelId === 73 ? inst.FncSetpoint : inst.modelId === 78 ? inst.Setpoint1RelativeTemp : inst.CurrentSetpoint ?? 0),
      differential: inst.CurrentDifferential ?? 0,
      isSensorError: Boolean(inst.modelId === 67 ? inst.IsErrorPressureSensor : inst.modelId === 73 ? inst.IsSensorError : inst.IsErrorS1),
      error: Boolean(inst.error),
      isFan: Boolean(inst.IsOutputFan),
      organizationId,
    }
  })
}

async function runCollectorLoop(config: NonNullable<Awaited<ReturnType<typeof resolveCollectorConfig>>>, runId: number) {
  while (store.get('isRunning') && runId === collectorRunId) {
    const cycleStartedAt = Date.now()

    if (socket?.readyState !== WebSocket.OPEN || !isSocketAuthenticated) {
      await sleep(500)
      continue
    }

    try {
      const instruments = await getInstrumentsWithValues(config)

      if (!store.get('isRunning') || runId !== collectorRunId) {
        break
      }

      const createPayload = mapInstrumentsForCreate(instruments, config.organizationId)
      if (createPayload.length && socket?.readyState === WebSocket.OPEN && isSocketAuthenticated) {
        sendWsMessage({
          type: 'INSTRUMENT_CREATE',
          payload: createPayload,
        })
      }

      const readingPayload = mapInstrumentsForReading(instruments, config.organizationId)
      if (readingPayload.length && socket?.readyState === WebSocket.OPEN && isSocketAuthenticated) {
        sendWsMessage({
          type: 'INSTRUMENT_READING',
          payload: readingPayload,
        })
      }
    } catch (err) {
      log.error('Failed collector polling cycle:', err)
    }

    const elapsed = Date.now() - cycleStartedAt
    const waitMs = Math.max(0, 5000 - elapsed)
    await sleep(waitMs)
  }
}

function scheduleReconnect() {
  if (!shouldReconnect || reconnectTimeout) return
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null
    const running = store.get('isRunning')
    if (running) startAppCollector()
  }, 3000)
}

export async function startAppCollector(): Promise<CollectorStartResult> {
  collectorRunId += 1
  const runId = collectorRunId

  const resolvedConfig = await resolveCollectorConfig()
  if (!resolvedConfig) {
    return { success: false, error: 'Falha ao carregar a configuracao do coletor.' }
  }
  let config = resolvedConfig
  if (!config.sitradUrl || !config.username || !config.password) {
    log.warn('Collector not started: missing Sitrad credentials.')
    store.set('isRunning', false)
    setTray(false)
    const error = 'Falha ao iniciar: credenciais do Sitrad ausentes.'
    emitRuntimeEvent({ status: 'error', message: error })
    return { success: false, error }
  }
  const deviceToken = config.token?.trim() || config.setupToken?.trim()
  if (!deviceToken) {
    log.warn('Collector not started: missing device token authentication.')
    store.set('isRunning', false)
    setTray(false)
    const error = 'Falha ao iniciar: token do dispositivo ausente ou invalido.'
    emitRuntimeEvent({ status: 'error', message: error })
    return { success: false, error }
  }

  store.set('isRunning', true)
  setTray(true)
  log.info('Collector started')
  emitRuntimeEvent({ status: 'running', message: 'Conectando ao servidor do coletor...' })

  shouldReconnect = true

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }

  isSocketAuthenticated = false
  closeCurrentSocket({ reconnect: false })

  log.info(`Connecting to collector WS: ${WS_URL}`)
  socket = new WebSocket(WS_URL)

  socket.on('open', async () => {
    log.info('WS connected')

    instrumentMapping = {}
    sendWsMessage({
      type: 'AUTH',
      payload: {
        organizationId: config.organizationId?.trim() || undefined,
        token: deviceToken,
        deviceToken,
      },
    })
  })

  socket.on('message', raw => {
    try {
      const msg = JSON.parse(raw.toString()) as WsIncomingMessage

      if (msg.type === 'AGENT_ALREADY_RUNNING') {
        const warning = msg.message || 'Ja existe um agente ativo para esta organizacao.'
        isSocketAuthenticated = false
        store.set('isRunning', false)
        setTray(false)
        shouldReconnect = false
        emitRuntimeEvent({ status: 'error', code: 'AGENT_ALREADY_RUNNING', message: warning })
        closeCurrentSocket({ reconnect: false })
        return
      }

      if (msg.type === 'AUTH_ERROR') {
        isSocketAuthenticated = false
        store.set('isRunning', false)
        setTray(false)
        shouldReconnect = false
        const isAlreadyRunning = isAgentAlreadyRunningMessage(msg.message)
        const authError = msg.message || 'Token inválido.'
        log.error(`WS auth error: ${authError}`)
        emitRuntimeEvent({
          status: 'error',
          code: isAlreadyRunning ? 'AGENT_ALREADY_RUNNING' : undefined,
          message: isAlreadyRunning ? authError : `Erro de autenticacao: ${authError}`,
        })
        closeCurrentSocket({ reconnect: false })
        return
      }

      if (msg.type === 'AUTH_OK') {
        const authPayload = resolveAuthOkPayload(msg)
        const organizationId =
          authPayload?.organizationId
          ?? authPayload?.organization_id
          ?? config.organizationId
        const userId =
          authPayload?.userId
          ?? authPayload?.user_id
          ?? config.userId
        const issuedDeviceToken =
          authPayload?.deviceToken
          ?? authPayload?.device_token
          ?? authPayload?.token
          ?? deviceToken

        if (!organizationId?.trim()) {
          isSocketAuthenticated = false
          store.set('isRunning', false)
          setTray(false)
          emitRuntimeEvent({
            status: 'error',
            message: 'Falha ao autenticar: o servidor nao retornou organizationId.',
          })
          shouldReconnect = false
          closeCurrentSocket({ reconnect: false })
          return
        }

        setCollectorConfig({
          organizationId: organizationId.trim(),
          userId: typeof userId === 'string' ? userId.trim() : '',
          token: issuedDeviceToken.trim(),
          setupToken: '',
          stopPassword: typeof authPayload?.stopPassword === 'string'
            ? authPayload.stopPassword.trim()
            : config.stopPassword,
        })

        config = {
          ...config,
          organizationId: organizationId.trim(),
          userId: typeof userId === 'string' ? userId.trim() : '',
          token: issuedDeviceToken.trim(),
          setupToken: '',
          stopPassword: typeof authPayload?.stopPassword === 'string'
            ? authPayload.stopPassword.trim()
            : config.stopPassword,
        }

        isSocketAuthenticated = true
        emitRuntimeEvent({ status: 'running', message: 'Enviando dados...' })
        void runCollectorLoop(config, runId).catch((err) => {
          log.error('Collector loop failed:', err)
          emitRuntimeEvent({ status: 'error', message: 'Falha no loop de coleta.' })
        })
        return
      }

      if (msg.type === 'INSTRUMENT_CREATED') {
        msg.payload.forEach(inst => {
          instrumentMapping[inst.slug] = inst.id
        })
        return
      }

      if (
        msg.type === 'INSTRUMENT_COMMAND'
        && isInstrumentCommandAction(msg.payload?.action)
      ) {
        void applyInstrumentCommand(msg.payload)
      }
    } catch (err) {
      log.error('Invalid WS message received:', err)
    }
  })

  socket.on('close', () => {
    isSocketAuthenticated = false
    scheduleReconnect()
  })
  socket.on('error', (err) => {
    log.error('Collector WS error:', err)
    emitRuntimeEvent({ status: 'error', message: 'Conexão com o servidor interrompida.' })
    scheduleReconnect()
  })

  return { success: true }
}

export function stopCollector() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }
  collectorRunId += 1
  store.set('isRunning', false)
  setTray(false)
  shouldReconnect = false
  closeCurrentSocket({ reconnect: false })
  isSocketAuthenticated = false
  log.info('Collector stopped')
  emitRuntimeEvent({ status: 'stopped', message: 'Envio interrompido.' })
}
