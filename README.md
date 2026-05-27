# KommuChat CRM

Sistema de CRM para clínicas e profissionais de saúde, com gestão de pacientes, agendamentos via Google Calendar, chat integrado ao WhatsApp e painel administrativo multi-tenant.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | Shadcn/ui + Radix UI + Tailwind CSS |
| Backend/DB | Supabase (PostgreSQL + Auth + Realtime) |
| Estado assíncrono | TanStack Query (React Query v5) |
| Estado global | React Context API |
| Roteamento | React Router DOM v6 |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts |
| WhatsApp | Evolution API + Baileys (backend Node.js) |
| Calendário | Google Calendar API (OAuth 2.0) |
| Notificações | Sonner |
| Ícones | Lucide React |

---

## Funcionalidades

### Dashboard
- Métricas em tempo real: total de pacientes, agendamentos, concluídos e pendentes
- Taxa de conversão com gauge visual
- Feed de conversas recentes
- Ações rápidas e filtros por período

### Gestão de Pacientes
- Cadastro completo com nome, e-mail e telefone
- Busca por nome ou telefone
- Status de atendimento: novo, retorno, topo de lista, atendimento final, cancelado
- Rastreamento de origem (IA vs. manual)
- Histórico de conversas do WhatsApp
- Edição inline e exclusão com confirmação
- Ordenação por data de cadastro

### Calendário
- Integração completa com Google Calendar (leitura e escrita de eventos)
- Visualização mensal e semanal
- Modal de criação de eventos com seleção de paciente
- Edição de data/hora com popover
- Suporte a eventos de dia inteiro e eventos com horário
- Codificação de eventos por cores
- Busca de consulta por nome do paciente

### WhatsApp
- Conexão via QR Code (Baileys/Evolution API)
- Interface de chat com histórico de mensagens
- Envio e recebimento de mensagens em tempo real
- Lista de contatos com avatares e fotos de perfil
- Suporte a variações de número brasileiro (12/13 dígitos)
- Monitoramento de status de conexão

### Painel Administrativo
- Autenticação separada para administradores
- Gerenciamento de clientes/clínicas
- Configuração de tabelas por tenant
- Controle de acesso por papel (Admin, Funcionário)

---

## Arquitetura

```
KommuChat-CRM/
├── src/
│   ├── pages/          # Páginas da aplicação (roteadas)
│   ├── components/     # Componentes reutilizáveis
│   │   └── ui/         # Primitivos Shadcn/ui
│   ├── contexts/       # Provedores de estado global (Auth, Theme, WhatsApp, Google)
│   ├── hooks/          # Custom hooks (Supabase, busca, perfil)
│   ├── lib/            # Serviços externos (Supabase, Google Calendar, WhatsApp)
│   ├── types/          # Definições TypeScript
│   └── App.tsx         # Componente raiz e configuração de rotas
├── backend/
│   ├── server.js       # Express + Socket.io + Baileys (WhatsApp)
│   └── config.js       # Configuração do backend
├── sql/                # Schemas e migrations do banco de dados
├── docs/               # Documentação adicional
└── scripts/            # Scripts de build e deploy
```


---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com base no `env.example`:

```env
# Supabase - Projeto principal (CRM)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Supabase - Projeto de pacientes (leitura)
VITE_SUPABASE_PATIENTS_URL=
VITE_SUPABASE_PATIENTS_ANON_KEY=

# Google Calendar OAuth
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_CLIENT_SECRET=
VITE_GOOGLE_REDIRECT_URI=

# Evolution API (WhatsApp)
VITE_EVOLUTION_API_URL=
VITE_EVOLUTION_API_KEY=
```

---

## Instalação e Execução

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta no Supabase
- Credenciais da Google Cloud Console (para Calendar)
- Evolution API configurada (para WhatsApp)

### Frontend

```bash
# Instalar dependências
npm install

# Iniciar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

O servidor de desenvolvimento roda em `http://localhost:8080` e faz proxy de `/api` e `/socket.io` para `http://localhost:3001`.

### Backend (WhatsApp)

```bash
cd backend

# Instalar dependências
npm install

# Iniciar o servidor
node server.js
```

O backend Express + Socket.io roda na porta `3001` e gerencia a conexão com o WhatsApp via Baileys.

---

## Papéis e Permissões

| Papel | Acesso |
|---|---|
| **Admin** | Acesso total: pacientes, calendário, WhatsApp, gerenciamento de funcionários |
| **Funcionário** | Acesso operacional: pacientes, calendário, chat |

---

## Deploy

O projeto está configurado para deploy no **Netlify** (`netlify.toml`). Para rodar em produção com WhatsApp, o backend Node.js precisa ser hospedado separadamente (ex: Railway, Fly.io, VPS).

---

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido para revolucionar o atendimento em saúde**
