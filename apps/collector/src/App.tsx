import { zodResolver } from '@hookform/resolvers/zod'
import {
  CheckCircle,
  Loader2,
  Minus,
  PlayCircle,
  Settings,
  Shield,
  Square,
  WifiOff,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import * as z from 'zod'

const configSchema = z.object({
  sitradUrl: z.string().url('URL invalida'),
  username: z.string().min(1, 'Usuario obrigatorio'),
  password: z.string().optional(),
  setupToken: z.string().optional(),
})

type ConfigData = z.infer<typeof configSchema>
type Status = 'running' | 'stopped' | 'testing' | 'idle' | 'error'
type SavedConfig = Partial<{
  sitradUrl: string
  username: string
  organizationId: string
  hasSavedPassword: boolean
  hasSavedSetupToken: boolean
  hasSavedStopPassword: boolean
  hasSavedDeviceToken: boolean
}>

function getStatusLabel(status: Status) {
  if (status === 'running') return 'Ativo'
  if (status === 'testing') return 'Testando'
  if (status === 'error') return 'Erro'
  if (status === 'stopped') return 'Parado'
  return 'Pronto'
}

export default function App() {
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    formState: { errors },
  } = useForm<ConfigData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      sitradUrl: '',
      username: '',
      password: '',
      setupToken: '',
    },
  })

  const [savedConfig, setSavedConfig] = useState<SavedConfig>()
  const [status, setStatus] = useState<Status>('idle')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showStopAuthModal, setShowStopAuthModal] = useState(false)
  const [stopAuthPassword, setStopAuthPassword] = useState('')
  const [stopping, setStopping] = useState(false)
  const [startBlocked, setStartBlocked] = useState(false)
  const [startBlockedReason, setStartBlockedReason] = useState('')

  async function loadInitialState() {
    const config = await window.electronAPI.getConfig()
    const running = await window.electronAPI.getState()

    if (config) {
      setSavedConfig(config)
      setValue('sitradUrl', config.sitradUrl ?? '')
      setValue('username', config.username ?? '')
      setValue('password', '')
      setValue('setupToken', '')
    }

    setStatus(running ? 'running' : 'stopped')
  }

  function ensureRequiredSecrets(data: ConfigData) {
    let hasError = false

    clearErrors(['password', 'setupToken'])

    if (!data.password?.trim() && !savedConfig?.hasSavedPassword) {
      setError('password', {
        type: 'manual',
        message: 'Senha obrigatoria para o primeiro acesso.',
      })
      hasError = true
    }

    return !hasError
  }

  function buildConfigPayload(data: ConfigData) {
    return {
      sitradUrl: data.sitradUrl.trim(),
      username: data.username.trim(),
      password: data.password?.trim() || undefined,
      setupToken: data.setupToken?.trim() || undefined,
    }
  }

  const testAPI = handleSubmit(async (data) => {
    if (!ensureRequiredSecrets(data)) return

    setLoading(true)
    setStatus('testing')
    setMessage('Testando conexao com o Sitrad...')
    setStartBlocked(false)
    setStartBlockedReason('')

    try {
      const payload = buildConfigPayload(data)
      await window.electronAPI.saveConfig(payload)
      const result = await window.electronAPI.testSitrad(payload)
      if (result.success) {
        setMessage('Conexao OK!')
        setStatus('idle')
        await loadInitialState()
      } else {
        setMessage(`Erro: ${result.error}`)
        setStatus('error')
      }
    } finally {
      setLoading(false)
    }
  })

  const start = handleSubmit(async (data) => {
    if (!ensureRequiredSecrets(data)) return

    if (startBlocked) {
      const warning = startBlockedReason || 'Ja existe um agente ativo para esta organizacao.'
      setStatus('error')
      setMessage(warning)
      window.alert(warning)
      return
    }

    const payload = buildConfigPayload(data)
    await window.electronAPI.saveConfig(payload)
    const result = await window.electronAPI.start()
    if (!result.success) {
      setStatus('error')
      setMessage(result.error ?? 'Falha ao iniciar o envio. Revise as configuracoes.')
      return
    }
    const running = await window.electronAPI.getState()
    setStatus(running ? 'running' : 'error')
    setMessage(running ? 'Enviando dados...' : 'Conectando ao servidor do coletor...')
    await loadInitialState()
  })

  const openStopAuthModal = () => {
    setStopAuthPassword('')
    setShowStopAuthModal(true)
  }

  const stop = async () => {
    if (!stopAuthPassword.trim()) {
      setStatus('error')
      setMessage('Digite a senha de parada para interromper o envio.')
      return
    }

    setStopping(true)
    const result = await window.electronAPI.stopWithAuth(stopAuthPassword)
    setStopping(false)
    if (!result.success) {
      setStatus('error')
      setMessage(result.error ?? 'Senha invalida.')
      return
    }

    setShowStopAuthModal(false)
    setStatus('stopped')
    setMessage('Envio interrompido.')
  }

  useEffect(() => {
    void loadInitialState()
    const unsubscribeStopAuth = window.electronAPI.onStopAuthRequested(() => {
      openStopAuthModal()
    })
    const unsubscribeCollectorEvent = window.electronAPI.onCollectorRuntimeEvent((event) => {
      if (event.code === 'AGENT_ALREADY_RUNNING') {
        setStartBlocked(true)
        setStartBlockedReason(event.message)
        window.alert(event.message)
      } else if (event.status === 'running') {
        setStartBlocked(false)
        setStartBlockedReason('')
      }
      setStatus(event.status)
      setMessage(event.message)
    })
    return () => {
      unsubscribeStopAuth()
      unsubscribeCollectorEvent()
    }
  }, [])

  const minimizeWindow = async () => {
    await window.electronAPI.minimizeWindow()
  }

  const toggleMaximizeWindow = async () => {
    await window.electronAPI.toggleMaximizeWindow()
  }

  const closeWindow = async () => {
    await window.electronAPI.closeWindow()
  }

  return (
    <div className="app-backdrop">
      <div className="window-shell">
        <div className="window-drag-bar">
          <div className="window-drag-left">
            <span className="window-drag-title">Cold Monitor Collector</span>
            <span className={`status-pill status-${status}`}>{getStatusLabel(status)}</span>
          </div>
          <div className="window-controls">
            <button type="button" className="window-control-btn" onClick={minimizeWindow} aria-label="Minimizar janela">
              <Minus size={16} />
            </button>
            <button type="button" className="window-control-btn" onClick={toggleMaximizeWindow} aria-label="Maximizar ou restaurar janela">
              <Square size={14} />
            </button>
            <button type="button" className="window-control-btn window-control-close" onClick={closeWindow} aria-label="Fechar janela">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="app-content">
          <header className="app-header">
            <div className="app-header-title">
              <Settings className="app-icon" size={24} />
              <h1>Cold Monitor Coletor</h1>
            </div>
            <p>Configure o acesso ao Sitrad, valide a conexao e acompanhe a autenticacao do dispositivo.</p>
          </header>

          <section className="panel">
            <div className="panel-heading">
              <Shield size={18} />
              <div>
                <strong>Seguranca e ativacao</strong>
                <p>Credenciais ficam protegidas no dispositivo e o token de ativacao e removido apos o primeiro login bem-sucedido.</p>
              </div>
            </div>
            <div className="security-badges">
              <span className={`info-badge ${savedConfig?.hasSavedPassword ? 'is-active' : ''}`}>
                Senha Sitrad {savedConfig?.hasSavedPassword ? 'salva' : 'pendente'}
              </span>
              <span className={`info-badge ${savedConfig?.hasSavedDeviceToken ? 'is-active' : ''}`}>
                Device token {savedConfig?.hasSavedDeviceToken ? 'ativo' : 'nao autenticado'}
              </span>
              <span className={`info-badge ${savedConfig?.hasSavedStopPassword ? 'is-active' : ''}`}>
                Senha de parada {savedConfig?.hasSavedStopPassword ? 'ativa' : 'nao configurada'}
              </span>
            </div>
          </section>

          <section className="panel">
            <div className="field-grid">
              <Input label="URL da API Sitrad" reg={register('sitradUrl')} error={errors.sitradUrl?.message} placeholder="https://192.168.0.100:8080/api/v1" />
              <Input label="Usuario" reg={register('username')} error={errors.username?.message} />
              <Input
                type="password"
                label="Senha"
                reg={register('password')}
                error={errors.password?.message}
                placeholder={savedConfig?.hasSavedPassword ? 'Preencha somente para substituir a senha salva' : 'Informe a senha do Sitrad'}
                hint={savedConfig?.hasSavedPassword ? 'Uma senha ja esta salva com seguranca neste dispositivo.' : undefined}
              />
              <Input
                type="password"
                label="Token de ativacao"
                reg={register('setupToken')}
                error={errors.setupToken?.message}
                placeholder="Use apenas no primeiro acesso ou para reativar o dispositivo"
                hint={savedConfig?.hasSavedDeviceToken ? 'O dispositivo ja possui autenticacao ativa. Informe um novo token apenas para trocar a vinculacao.' : undefined}
              />
            </div>
          </section>

          <section className="actions">
            <button onClick={testAPI} disabled={loading} className="btn btn-primary">
              {loading && <Loader2 className="animate-spin" size={18} />}
              Testar API
            </button>

            {status !== 'running' ? (
              <button onClick={start} className="btn btn-success" disabled={startBlocked}>
                <PlayCircle size={18} /> Iniciar Envio
              </button>
            ) : (
              <button onClick={openStopAuthModal} className="btn btn-danger">
                <Square size={18} /> Parar Envio
              </button>
            )}
          </section>

          {message && (
            <div className={`feedback feedback-${status}`}>
              {status === 'running' && <CheckCircle size={18} />}
              {status === 'error' && <WifiOff size={18} />}
              {status === 'testing' && <Loader2 size={18} className="animate-spin" />}
              <span>{message}</span>
            </div>
          )}

          {showStopAuthModal && (
            <div className="modal-overlay">
              <div className="modal-panel">
                <h2>Autenticar parada</h2>
                <p>Digite a senha para interromper o envio.</p>
                <input
                  type="password"
                  value={stopAuthPassword}
                  onChange={(event) => setStopAuthPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void stop()
                  }}
                  placeholder="Senha de parada"
                  autoFocus
                />
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowStopAuthModal(false)} disabled={stopping}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-danger" onClick={stop} disabled={stopping}>
                    {stopping && <Loader2 className="animate-spin" size={18} />}
                    Confirmar parada
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Input({
  label,
  error,
  type = 'text',
  reg,
  placeholder,
  hint,
}: {
  label: string
  error?: string
  type?: string
  reg: UseFormRegisterReturn
  placeholder?: string
  hint?: string
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input {...reg} type={type} placeholder={placeholder} />
      {hint && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
