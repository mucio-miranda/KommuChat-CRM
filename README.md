# CRM KOMMUchat

Sistema de CRM desenvolvido para gerenciar conversas, agendamentos e interações de clínicas e profissionais da saúde com seus pacientes, integrando diretamente com WhatsApp via fluxos no n8n e usando o Supabase como banco de dados.

## 🚀 Características

- **Multi-tenant**: Cada cliente (clínica/profissional) tem sua própria base de dados isolada
- **Integração WhatsApp**: Conecta com fluxos de automação via n8n
- **Gestão de Pacientes**: Cadastro completo com histórico de conversas
- **Agendamentos**: Sistema de calendário para consultas e retornos
- **Dashboard Intuitivo**: Métricas e visão geral em tempo real
- **Controle de Acesso**: Papéis Admin e Funcionário com permissões específicas

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Vite
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Automação**: n8n para fluxos de WhatsApp
- **Estado**: React Query + Context API

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- n8n configurado (opcional para desenvolvimento)

## 🔧 Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd CRM-KOMMUCHAT
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

- **clientes**: Informações das clínicas/profissionais
- **usuarios**: Usuários do sistema com papéis
- **pacientes**: Cadastro de pacientes
- **conversas**: Histórico de mensagens do WhatsApp
- **agendamentos**: Consultas e retornos agendados

### Esquema de Multi-tenancy

Cada cliente tem suas próprias tabelas com prefixo único, garantindo isolamento completo dos dados.

## 🔐 Autenticação

O sistema suporta dois tipos de usuário:

- **Admin**: Acesso completo à clínica
- **Funcionário**: Acesso limitado aos dados necessários

## 📱 Integração WhatsApp

1. Configure seus fluxos no n8n
2. Conecte com a API do Supabase
3. As mensagens são sincronizadas em tempo real
4. Status dos pacientes é atualizado automaticamente

## 🚀 Deploy

### Build de Produção
```bash
npm run build
```

### Variáveis de Ambiente para Produção
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

## 📊 Funcionalidades

### Dashboard
- Métricas em tempo real
- Últimos contatos
- Ações rápidas
- Filtros por período

### Gestão de Pacientes
- Cadastro completo
- Histórico de conversas
- Status de atendimento
- Busca e filtros

### WhatsApp
- Visualização de conversas
- Status de mensagens
- Integração com n8n
- Histórico completo

### Calendário
- Agendamento de consultas
- Lembretes automáticos
- Gestão de horários
- Confirmações

## 🔧 Desenvolvimento

### Scripts Disponíveis
- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run lint` - Verificação de código
- `npm run preview` - Preview do build

### Estrutura de Pastas
```
src/
├── components/     # Componentes reutilizáveis
├── contexts/      # Contextos React (Auth, etc.)
├── hooks/         # Hooks customizados
├── lib/           # Configurações e utilitários
├── pages/         # Páginas da aplicação
└── ui/            # Componentes de UI base
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através dos canais oficiais do projeto.

---

**Desenvolvido com ❤️ para revolucionar o atendimento em saúde**
