# KommuChat CRM — Documentação do Projeto

> Sistema de CRM para clínicas e profissionais de saúde, com gestão de pacientes,
> agendamentos via Google Calendar e chat integrado ao WhatsApp.
> Fonte única de verdade do projeto — mantida atualizada a cada decisão relevante.
> Baseada em leitura completa do código-fonte (não apenas do README).

---

## 1. Visão geral

O **KommuChat CRM** é uma plataforma **multi-tenant** vendida como "login pré-configurado"
para clínicas/profissionais de saúde: cada cliente (tenant) recebe uma conta com Google
Calendar, WhatsApp (Evolution API) e uma tabela de pacientes já associadas. O sistema une
três frentes num só painel:

- **Pacientes** — cadastro, status de atendimento e origem (IA vs. manual/humano).
- **Calendário** — agendamentos sincronizados com o Google Calendar do profissional.
- **WhatsApp (Chat)** — histórico de conversas e envio de mensagens via Evolution API.

Por trás da captação de pacientes existe uma **automação externa via n8n**, que atende
o WhatsApp do cliente com IA, registra/atualiza pacientes numa tabela Supabase e guarda o
histórico de conversa diretamente na própria linha do paciente (coluna `whatsapp`, JSON).
O CRM é a camada de visualização/gestão humana sobre esses dados — ele não é a origem da
automação de IA, é quem lê, complementa e eventualmente assume ("Atendimento Humano") a
conversa.

**Papéis de acesso (dentro de um tenant):**

| Papel | Acesso |
|---|---|
| **Admin** (tenant) | Total: pacientes, calendário, chat, gerenciamento de funcionários |
| **Funcionário** | Operacional: pacientes, calendário, chat |

Existe ainda um **painel de super-admin da plataforma**, completamente separado
(`/admin/login`, `/admin/dashboard`), usado para provisionar novos clientes/tenants:
gerar credenciais Google criptografadas, gerar `.env` por cliente e disparar deploy
automático (Vercel/Netlify) — ver seção 7.

**Fluxo de Git:** repositório com uma única branch, `main`. Não há branches de feature
nem Pull Requests — o trabalho vai direto para `main`, e o **push é sempre manual**,
feito pelo usuário (nunca pelo agente). Ver [[git-commit-convention]].

---

## 2. Stack tecnológica

### Frontend (raiz do repo)

| Camada | Tecnologia | Função |
|---|---|---|
| Framework / build | React 18 + TypeScript + Vite | SPA, dev server na porta `8080` |
| UI | Shadcn/ui + Radix UI + Tailwind CSS | Componentes copiados no repo (`src/components/ui`) |
| Estado assíncrono | TanStack Query (React Query v5) | Instalado, mas a maior parte das telas usa `useState`/`useEffect` + polling manual em vez de `useQuery` |
| Estado global | React Context API | Auth, Admin Auth, Theme, WhatsApp, Google Calendar |
| Roteamento | React Router DOM v6 | Rotas protegidas por contexto de auth |
| Formulários | React Hook Form + Zod | Validação de forms (paciente, evento, login) |
| Gráficos | Recharts | Métricas do Dashboard |
| Notificações | Sonner | Toasts |
| Ícones | Lucide React | — |
| Datas | date-fns | Formatação/cálculo de datas (locale pt-BR) |
| Criptografia | crypto-js | Criptografia AES-256 de credenciais Google por cliente (painel de super-admin) |

### Backend / integrações

| Camada | Tecnologia | Função real |
|---|---|---|
| Banco / Auth / Realtime | Supabase (PostgreSQL) | **Dois projetos Supabase distintos** — ver seção 4. Não usa Supabase Auth: autenticação é uma tabela própria + RPC de verificação de senha (seção 5) |
| WhatsApp (produção) | **Evolution API** (serviço externo, hospedado à parte) | `src/lib/evolution-service.ts`, credenciais por cliente em `configuracoes_cliente` |
| WhatsApp (legado/dev) | Baileys direto (Node/Express/Socket.io) | `backend/server.js` — ver observação na seção 7 |
| Calendário | Google Calendar API (OAuth 2.0) | `src/lib/google-calendar-hybrid.ts` + `google-service.ts` + `supabase-google-tokens.ts` |
| Deploy frontend | Netlify (`netlify.toml`) | Build estático (`dist/`) |
| Deploy backend | Não versionado no repo | `backend/` não tem `package.json`; se ainda usado, roda fora do fluxo de deploy documentado |

O `vite.config.ts` faz proxy de `/api` e `/socket.io` para `http://localhost:3001` em
desenvolvimento — resquício da integração direta com `backend/server.js` (Baileys), hoje
não usada pelo fluxo real de WhatsApp (que é 100% Evolution API, chamada direto do
browser). Ver seção 10 (Pontos em aberto).

---

## 3. Estrutura de pastas

```
KommuChat-CRM/
├── src/
│   ├── pages/          # Páginas roteadas (Index, Pacientes, Calendario, Automatizacoes/Chat,
│   │                   #   Login, AdminLogin, AdminDashboard, EmployeeManagement, GoogleCallback,
│   │                   #   PrivacyPolicy, NotFound)
│   ├── components/      # Componentes reutilizáveis (modais, popovers, cards, StatusBadge...)
│   │   └── ui/           # Primitivos Shadcn/ui (copiados, não é dependência externa)
│   ├── contexts/         # AuthContext, AdminAuthContext, ThemeContext,
│   │                     #   GoogleCalendarContext(Simple), WhatsAppContext
│   ├── hooks/            # use-mobile, use-toast, usePatientsSearch, useProfilePicture, useSupabase
│   ├── lib/              # Supabase clients, Google Calendar, Evolution/WhatsApp helpers, utils
│   ├── types/            # Patient, google-calendar
│   └── App.tsx            # Rotas + providers (ver seção 6)
├── backend/
│   ├── server.js          # Express + Socket.io + Baileys (WhatsApp) — legado, sem package.json
│   ├── simple-server.js / simple-server.cjs / minimal-server.cjs  # variantes alternativas do mesmo legado
│   └── config.js
├── sql/                  # Scripts SQL avulsos (schema, RLS, fixes) — não são migrations versionadas
├── scripts/              # Scripts utilitários Node (setup admin, limpar dados de teste, etc.)
├── docs/                 # Guias específicos (Google OAuth, RLS, WhatsApp, multi-tenant, deploy...)
└── netlify.toml           # Config de deploy do frontend
```

**Alias `@` → `./src`** configurado em `vite.config.ts` e `tsconfig.json`/`tsconfig.app.json`
(exigência do Shadcn/ui).

**`sql/`** é um conjunto de scripts soltos (várias variações de "fix-rls-*", "disable-rls-*"),
não um sistema de migrations. Ao mexer em schema/RLS, checar os arquivos mais recentes antes
de assumir o estado atual do banco.

---

## 4. Dados — dois projetos Supabase, papéis distintos

O projeto usa **dois projetos Supabase diferentes**, com papéis fixos e não-intercambiáveis
(reforçado pelo hook `useSupabase()`, `src/hooks/useSupabase.ts`):

| Cliente (`useSupabase()`) | Env vars | Projeto | Uso |
|---|---|---|---|
| `read` (`src/lib/supabase.ts`) | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Projeto **"pacientes"** (alimentado pelo n8n) | **Leitura e escrita de pacientes/conversas** — apesar do nome, a tela de Pacientes grava diretamente aqui (update de nome, status, data de agendamento, exclusão) |
| `write` / `config` (`src/lib/supabase-crm.ts`) | `VITE_CRM_SUPABASE_URL` / `VITE_CRM_SUPABASE_ANON_KEY` | Projeto **"CRM"** | Usuários, clientes/tenants, configurações por cliente, tokens do Google, QR codes, credenciais criptografadas |

> Os nomes das env vars não são 100% consistentes entre `env.example`, `README.md` e o
> código (`VITE_CRM_SUPABASE_*` no código vs. `VITE_SUPABASE_PATIENTS_*` citado no README).
> Ao integrar algo novo, confirme em `src/lib/` qual variável está realmente sendo lida.

### Tabela de pacientes: dinâmica por cliente, não um nome fixo

Não existe uma tabela `pacientes` única. Cada tenant pode ter sua própria tabela no projeto
"pacientes", referenciada em `configuracoes_cliente` (chave `tabela_supabase`, projeto CRM).
Se não houver configuração, o **padrão é `kommuchat_mvp`**. Esse lookup é repetido de forma
independente em `Pacientes.tsx`, `Automatizacoes.tsx` e `Index.tsx` (não há um hook
compartilhado `useClienteTableName` — candidato a extração, mas não crítico).

Colunas observadas na tabela dinâmica de pacientes (via queries reais no código):
`id, nome, email, telefone, chatid, atende_humano, setdata, followup, follow, topoucall,
atendimentofinal, data_agendamento, lembrete, whatsapp`.

- `whatsapp` é uma **coluna JSON** com o histórico completo da conversa (array de
  interações) — não existe uma tabela `mensagens`/`conversas` separada na prática, embora
  `src/lib/supabase.ts` e `supabase-crm.ts` declarem um tipo `Conversa` que não é usado
  no fluxo real de chat.
- `chatid` determina a **fonte** do paciente: contém `@` (formato WhatsApp do n8n, ex.
  `5511999@s.whatsapp.net`) → `fonte: 'ia'`; sem `@` (telefone puro) → `fonte: 'humano'`
  (criado manualmente pelo CRM). Essa derivação acontece no frontend
  (`Pacientes.tsx`), não é um campo gravado no banco.
- Só pacientes com `fonte === 'humano'` podem ser editados/excluídos pelo CRM; pacientes
  de IA são somente leitura + ações permitidas (agendamento, toggle de atendimento, edição
  de nome).

### Status do paciente é **derivado**, não é uma coluna de status

Não existe coluna `status`. `getPatientStatus()` (duplicada em `Pacientes.tsx` e usada de
forma equivalente em `Automatizacoes.tsx`) calcula o status a partir de outras colunas:

```
data_agendamento com ano 9999   → "cancelou_agendamento"
data_agendamento (qualquer outro ano) → "topoucall"
atendimentofinal = true          → "atendimentofinal"
followup = true OU follow = true → "followup"
(nenhum dos anteriores)          → "novo"
```

`atendimentofinal`/`followup`/`follow` chegam do banco como **strings** (`"true"`/`"false"`),
daí o helper `checkTrue()` repetido em várias telas. `data_agendamento` com ano **9999** é
um sentinel usado pela automação para marcar "agendamento cancelado" sem apagar a data.

| Valor derivado | Label exibido (`StatusBadge`) |
|---|---|
| `novo` | Novo |
| `followup` | Em contato |
| `topoucall` | Agendado |
| `atendimentofinal` | Desativado |
| `cancelou_agendamento` | Cancelado |

> Ao renomear labels, mude só o texto em `StatusBadge` — os valores internos e a lógica de
> derivação em `getPatientStatus()` são o contrato real com os dados do n8n; não renomear
> sem checar as duas pontas.

### Entidades do projeto "CRM" (`src/lib/supabase-crm.ts`, confirmado em `sql/create-crm-tables.sql`)

| Tabela | Campos principais |
|---|---|
| `clientes` | id, nome, email, telefone, tipo (`clinica`\|`profissional`), cnpj_cpf, endereco, ativo |
| `usuarios` | id, auth_user_id (FK para `auth.users`, **não usado no login real** — ver seção 5), email, nome, role (`admin`\|`funcionario`), cliente_id, ativo |
| `configuracoes_cliente` | id, cliente_id, chave, valor, tipo — chave/valor genérico por tenant (Evolution API, tabela de pacientes, etc.) |
| `admin_users` | usuários do painel de super-admin, com `password_hash`, `locked_until`, contadores de tentativas de login (separado de `usuarios`) |
| `whatsapp_qr_codes` | QR codes enviados manualmente por cliente (upload, não geração automática) |
| `google_credentials` / `deployment_configs` | Credenciais Google e config de deploy por cliente, usadas pelo painel de super-admin (seção 7) |

### Telefone (normalização, feature recente)

Commits recentes (`221adb4`, `e220323`) adicionaram normalização de telefone para formato
internacional ao salvar paciente, e bloqueio de criação de paciente com telefone duplicado.
O app também lida historicamente com variações de número brasileiro (12/13 dígitos, com/sem
o nono dígito) via `getBrazilianAlternativePhone` em `src/lib/whatsapp-helpers.ts` — usado
como fallback ao enviar mensagem: se a Evolution API responder que o número de 13 dígitos
não existe no WhatsApp, tenta reenviar com a variante de 12 dígitos (e vice-versa).

---

## 5. Autenticação — não usa Supabase Auth

Dois sistemas de autenticação **independentes e customizados**. Nenhum dos dois usa
`supabase.auth.signIn*`: ambos fazem `SELECT` na tabela correspondente + chamada RPC
para validar a senha (hash verificado no Postgres), e persistem a sessão em
`localStorage` (sem JWT/cookie de sessão do Supabase).

| | Operacional (tenant) | Super-admin (plataforma) |
|---|---|---|
| Context | `AuthContext` | `AdminAuthContext` |
| Tabela | `usuarios` (projeto CRM) | `admin_users` (projeto CRM) |
| Login por | email **ou** `username` | `username` |
| Verificação de senha | RPC `verify_password` | RPC `verify_admin_password` (bcrypt) |
| Proteções extra | — | bloqueio de conta (`locked_until`) após tentativas falhas, contador resetado no sucesso |
| Persistência | `localStorage['kommuchat_user']` | `localStorage['kommuchat_admin']` |
| Rota de login | `/login` | `/admin/login` |
| Rota protegida | `ProtectedRoute` (`App.tsx`) | `AdminProtectedRoute` (`App.tsx`) |

Não confundir os dois "Admin": o papel **Admin** dentro de um tenant (`usuarios.role =
'admin'`, acesso total às telas operacionais) é diferente do super-admin da plataforma
(`admin_users`), que gerencia os próprios clientes/tenants — são tabelas, logins e
propósitos completamente separados.

> A coluna `usuarios.auth_user_id` (FK para `auth.users`) existe no schema SQL mas não é
> usada no fluxo de login atual (`AuthContext.signIn` não chama `supabase.auth`). Provável
> resquício de uma versão anterior baseada em Supabase Auth — não assumir que está em uso.

---

## 6. Rotas (`src/App.tsx`)

| Rota | Página | Proteção |
|---|---|---|
| `/login` | `Login` | pública |
| `/privacy-policy` | `PrivacyPolicy` | pública |
| `/admin/login` | `AdminLogin` | pública |
| `/admin/dashboard` | `AdminDashboard` | `AdminProtectedRoute` |
| `/` e `/dashboard` | `Index` (Dashboard) | `ProtectedRoute` |
| `/pacientes` | `Pacientes` | `ProtectedRoute` |
| `/calendario` | `Calendario` | `ProtectedRoute` |
| `/chat` | `Automatizacoes` (página de Chat/WhatsApp) | `ProtectedRoute` |
| `/funcionarios` | `EmployeeManagement` | `ProtectedRoute` |
| `/auth/google/callback` | `GoogleCallback` | pública (callback OAuth) |
| `*` | `NotFound` | — |

> A página de Chat/WhatsApp vive no arquivo `Automatizacoes.tsx` mas é roteada em `/chat`
> (rename de UI sem rename de arquivo — commit `ddb6e4e`). `/usuarios` foi removida; a
> gestão de clientes migrou para `/admin/dashboard` (o `docs/SISTEMA_MULTI_TENANT.md` ainda
> cita `/usuarios` — documento desatualizado nesse ponto).

**Ordem de providers** (`App.tsx`): `QueryClientProvider` → `ThemeProvider` →
`AuthProvider` → `AdminAuthProvider` → `GoogleCalendarProvider` (`GoogleCalendarContextSimple`)
→ `WhatsAppProvider` → `TooltipProvider` → `BrowserRouter`.

---

## 7. Integrações externas

### Google Calendar
- OAuth 2.0, callback em `/auth/google/callback` (`src/pages/GoogleCallback.tsx`).
- **Implementação ativa:** `GoogleCalendarContextSimple` (é este, não `GoogleCalendarContext.tsx`,
  que está registrado em `App.tsx`) usa `google-calendar-hybrid.ts`
  (`googleCalendarServiceHybrid`) + `google-service.ts` (`sharedGoogleCredentialsService`,
  credenciais Google **compartilhadas/por cliente**) + `supabase-google-tokens.ts`
  (persistência dos tokens no Supabase — única fonte de verdade da conexão, o `localStorage`
  só guarda um cache de UI).
- `google-calendar.ts`, `google-calendar-simple.ts`, `simple-google-service.ts` **não estão
  no caminho ativo** (não são importados pelo Context em uso) — provável código legado de
  iterações anteriores da integração.
- Refresh automático de token a cada 5 minutos enquanto conectado (`Calendario.tsx`).
- Eventos: criação com seleção de paciente (`CreateEventModal`), edição de data/hora via
  popover (`DatePickerPopover`/`EditDatePopover`), auto-seleção de paciente por
  `data_agendamento`, exclusão com confirmação, filtro de eventos recorrentes/feriados nas
  métricas do Dashboard (`src/lib/date-utils.ts`, `isHolidayEvent`).

### WhatsApp — fluxo real é via Evolution API (não via `backend/`)

1. Cada tenant tem suas credenciais da Evolution API (`evo_base_url`, `evo_instance`,
   `evo_api_key`) salvas em `configuracoes_cliente` (`getEvolutionConfig`/`saveEvolutionConfig`
   em `src/lib/supabase-crm.ts`).
2. `WhatsAppContext` (`src/contexts/WhatsAppContext.tsx`) chama `evolutionService`
   (`src/lib/evolution-service.ts`) **diretamente do browser** — sem passar pelo
   `backend/server.js` — para: obter QR Code (`/instance/connect/:instance`), checar status
   (`/instance/status/:instance` com fallback para `/instance/fetchInstances`), enviar
   mensagem (`/message/sendText/:instance`), buscar foto de perfil, desconectar.
3. Ao enviar mensagem pelo CRM, o texto recebe um prefixo invisível (zero-width space) para
   diferenciar, no histórico, mensagens enviadas pelo humano via CRM das enviadas pela IA
   (commit `497a38f`).
4. **O conteúdo das conversas não é escrito pelo frontend** — quem grava a coluna `whatsapp`
   do paciente é a automação externa (n8n), que observa a Evolution API. Por isso, após
   enviar uma mensagem, o frontend só recarrega os dados 3s depois (tempo para o n8n
   processar), em vez de atualizar a UI de forma otimista com o conteúdo real.
5. Polling: lista de conversas e mensagens do paciente selecionado a cada 10s
   (`Automatizacoes.tsx`); status de conexão verificado a cada 3s durante "connecting" e a
   cada 10s em background (`WhatsAppContext`).

`backend/server.js` (Express + Socket.io + Baileys, porta `3001`, proxy configurado em
`vite.config.ts`) implementa uma conexão **direta** ao WhatsApp via Baileys — mas nada no
frontend em uso hoje (`WhatsAppContext`, `Automatizacoes.tsx`) chama essa API. É considerado
legado/experimental até confirmação em contrário — ver seção 10.

### Painel de super-admin — provisionamento de clientes

Documentado em `docs/ARQUITETURA_SOLUCAO.md` e `docs/SISTEMA_MULTI_TENANT.md`: o super-admin
(`AdminDashboard.tsx`) cria novos tenants com credenciais Google **criptografadas com AES-256**
(`crypto-js`, tabela `google_credentials`), gera arquivos `.env` por cliente
(`src/lib/client-env-generator.ts`) e pode disparar **deploy automático** via API da
Vercel/Netlify ou webhook genérico (`src/lib/auto-deployment-service.ts`, tabela
`deployment_configs`). Esse é o mecanismo que sustenta o modelo "vender login
pré-configurado" descrito nos docs — cada clínica ganha uma instância configurada sem setup
manual do time.

---

## 8. Módulos principais (telas)

1. **Dashboard** (`Index.tsx`) — métricas (Contatos, Pacientes, Consultas no mês) calculadas
   no frontend a partir da tabela de pacientes do tenant + eventos do Google Calendar
   (excluindo recorrentes/feriados), feed de conversas recentes, gauge de conversão,
   auto-refresh a cada 30s.
2. **Pacientes** (`Pacientes.tsx`) — tabela com busca, filtro por status, ordenação por
   coluna, paginação (20/página), edição inline de nome e data de agendamento, modal de
   novo/editar paciente, exclusão (só `fonte === 'humano'`), toggle de atendimento
   (IA ativa/desativada), auto-refresh a cada 30s.
3. **Calendário** (`Calendario.tsx`) — visualização mensal/semanal (3 dias no mobile, 7 no
   desktop), criação/edição/exclusão de eventos, integração com Google Calendar, busca de
   consulta por nome/descrição/local, refresh automático de token a cada 5min, deep-link
   via query params (`openModal`, `patientId`, `date`) usado pelo Dashboard/Pacientes para
   abrir o modal de evento já com paciente ou data pré-selecionados.
4. **Chat/WhatsApp** (`Automatizacoes.tsx`, rota `/chat`) — tela cheia quando conectado:
   lista de conversas (pacientes com coluna `whatsapp` preenchida) + painel de mensagens,
   envio via Evolution API, edição de nome do contato, toggle de atendimento, busca por
   nome/telefone, auto-refresh a cada 10s.
5. **Painel Admin** (`AdminDashboard.tsx`) — provisionamento de tenants: credenciais Google,
   geração de `.env`, deploy automático (seção 7).
6. **Funcionários** (`EmployeeManagement.tsx`) — CRUD de usuários operacionais (`usuarios`)
   do tenant logado.

---

## 9. Ambiente e execução

```bash
# Frontend
npm install
npm run dev        # http://localhost:8080, proxy /api e /socket.io → :3001 (legado, ver seção 7)
npm run build        # build de produção (dist/)
npm run lint

# Backend legado (Baileys) — sem package.json, ver seção 10
cd backend
node server.js      # porta 3001
```

### Variáveis de ambiente (`.env`, ver `env.example`)

```env
VITE_SUPABASE_URL=              # Supabase "pacientes" (leitura + escrita de dados do paciente)
VITE_SUPABASE_ANON_KEY=
VITE_CRM_SUPABASE_URL=          # Supabase "CRM" (usuários, clientes, config, credenciais)
VITE_CRM_SUPABASE_ANON_KEY=
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_CLIENT_SECRET=
VITE_GOOGLE_REDIRECT_URI=
VITE_ENCRYPTION_KEY=            # AES-256 das credenciais Google no painel de super-admin
VITE_EVOLUTION_API_URL=         # fallback/default; cada tenant também pode ter config própria em configuracoes_cliente
VITE_EVOLUTION_API_KEY=
```

Credenciais reais da Evolution API usadas no chat **não vêm direto dessas env vars** — vêm
de `configuracoes_cliente` por `cliente_id` (`getEvolutionConfig`). As env vars acima servem
mais como fallback/config de desenvolvimento.

### Deploy
- **Frontend:** Netlify (`netlify.toml`), publish em `dist/`, redirect SPA (`/* → /index.html`),
  headers de segurança e cache configurados.
- **Backend legado:** se necessário, precisa de hospedagem própria com processo Node
  persistente (Railway, Fly.io ou VPS) — Netlify não serve para o socket long-lived do
  Baileys. Não confirmado se está em uso em produção (seção 10).

---

## 10. Pontos em aberto

- **`backend/server.js` (Baileys) parece legado.** O fluxo real de WhatsApp usado pelas
  telas (`WhatsAppContext`, `Automatizacoes.tsx`) é 100% via Evolution API externa,
  configurada por tenant em `configuracoes_cliente`. Ninguém no frontend chama
  `/api/whatsapp/*` do backend. Antes de investir nele (ou de removê-lo), confirmar com o
  responsável se ainda está em uso em algum ambiente.
- **`backend/` sem `package.json` versionado** — dependências de `server.js`
  (`express`, `socket.io`, `@whiskeysockets/baileys`, `pino`, `@hapi/boom`, `cors`, `qrcode`)
  não estão declaradas em nenhum manifesto do repositório.
- **Múltiplas implementações paralelas de Google Calendar** em `src/lib/`
  (`google-calendar.ts`, `-simple`, `-hybrid`, `google-service.ts`, `simple-google-service.ts`).
  Confirmado que a ativa é `-hybrid` + `google-service.ts`; as demais parecem não
  referenciadas pelo Context em uso — candidatas a remoção após confirmação.
- **Nomenclatura de env vars inconsistente** entre `env.example`, `README.md` e código
  (`VITE_CRM_SUPABASE_*` vs. `VITE_SUPABASE_PATIENTS_*`) — checar sempre `src/lib/` antes
  de confiar no README.
- **`sql/`** é uma pasta de scripts soltos (muitos "fix-rls-*"/"disable-rls-*"), sem
  controle de migrations — o estado real do schema/RLS em produção não é 100% rastreável
  só pelo repositório.
- **`usuarios.auth_user_id`** existe no schema mas não é usado pelo login real
  (`AuthContext` não usa Supabase Auth) — possível resquício de uma versão anterior.
- **Página `/chat` vive em `Automatizacoes.tsx`** — rename de UI sem rename de arquivo;
  não crítico, mas gera confusão ao navegar pelo código pela primeira vez.
- **`docs/SISTEMA_MULTI_TENANT.md` cita a rota `/usuarios`**, que não existe mais no
  roteador atual (migrou para `/admin/dashboard`) — doc desatualizado nesse trecho.
