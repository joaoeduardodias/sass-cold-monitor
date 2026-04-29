# Cold Monitor Collector

## Seguranca e ativacao

- Credenciais sensiveis do coletor sao persistidas com protecao do sistema operacional quando disponivel.
- O `setupToken` e usado apenas no primeiro login bem-sucedido e depois e removido do armazenamento local.
- Em producao, o app procura `config.json` nestes locais:
  1. pasta `userData` do app
  2. pasta do executavel
  3. pasta `resources`
  4. pasta pai de `resources`
  5. diretorio atual

Campos aceitos em `config.json`:

- `setupToken`
- `token` ou `deviceToken`
- `organizationId`, `organization_id`, `orgId` ou `organization.id`
- `stopPassword`

## Desinstalacao

- A desinstalacao deve ser feita pelo Windows em `Aplicativos instalados` / `appwiz.cpl`.
- O instalador agora remove tambem entradas de inicializacao automatica e atalhos residuais no processo de uninstall.

## .env

O app agora carrega variaveis de ambiente em tempo de execucao pelos arquivos abaixo, nessa ordem:

1. `.env`
2. `.env.local`
3. `.env` ao lado do executavel
4. `.env.local` ao lado do executavel
5. `.env` em `resources`
6. `.env.local` em `resources`

Variaveis suportadas:

- `COLLECTOR_API_BASE_URL`
- `COLLECTOR_WS_URL`

Exemplo para desenvolvimento:

```env
COLLECTOR_API_BASE_URL=http://localhost:3333
COLLECTOR_WS_URL=ws://localhost:3333/ws/agent
```

Exemplo para producao:

```env
COLLECTOR_API_BASE_URL=https://api-cold-monitor.onrender.com
COLLECTOR_WS_URL=wss://api-cold-monitor.onrender.com/ws/agent
```

Se nenhum `.env` existir, o app usa `localhost` em desenvolvimento e `onrender` em producao.
