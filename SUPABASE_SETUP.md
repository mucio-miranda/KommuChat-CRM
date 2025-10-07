# Configuração do Supabase para KOMMUchat CRM

Este guia explica como configurar o Supabase para conectar com dados reais da tabela `kommuchat_mvp`.

## Opção 1: Usar Projeto Supabase Existente

Se você já tem um projeto Supabase com a tabela `kommuchat_mvp`:

### 1. Obter Credenciais

1. Acesse [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto
4. Vá em **Settings** > **API**
5. Copie:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public** key

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

# Google Calendar API Configuration
VITE_GOOGLE_CLIENT_ID=seu_google_client_id
VITE_GOOGLE_CLIENT_SECRET=seu_google_client_secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback

# App Configuration
VITE_APP_NAME=KOMMUchat CRM
VITE_APP_VERSION=1.0.0
```

### 3. Reiniciar Aplicação

```bash
npm run dev
```

## Opção 2: Criar Novo Projeto Supabase

Se você não tem um projeto Supabase:

### 1. Criar Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **New Project**
3. Escolha sua organização
4. Nome do projeto: `KOMMUchat CRM`
5. Senha do banco: (escolha uma senha forte)
6. Região: escolha a mais próxima
7. Clique em **Create new project**

### 2. Criar Tabela kommuchat_mvp

1. No dashboard do Supabase, vá em **Table Editor**
2. Clique em **New Table**
3. Nome da tabela: `kommuchat_mvp`
4. Use o seguinte SQL:

```sql
CREATE TABLE kommuchat_mvp (
  id SERIAL PRIMARY KEY,
  nome TEXT,
  telefone TEXT,
  chatid TEXT,
  email TEXT,
  atende_humano TEXT,
  setdata TEXT,
  followup TEXT,
  follow TEXT,
  topoucall TEXT,
  atendimentofinal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir dados de exemplo
INSERT INTO kommuchat_mvp (nome, telefone, chatid, email, followup) VALUES
('Maria Silva', '(11) 99999-1234', '554199991234', 'maria.silva@email.com', '1'),
('João Santos', '(11) 98888-5678', '554198885678', 'joao.santos@email.com', '1'),
('Ana Costa', '(11) 97777-9012', '554197779012', 'ana.costa@email.com', '1'),
('Carlos Oliveira', '(11) 96666-3456', '554196663456', 'carlos.oliveira@email.com', '1'),
('Fernanda Lima', '(11) 95555-7890', '554195557890', 'fernanda.lima@email.com', '1');
```

### 3. Configurar Políticas de Segurança

1. Vá em **Authentication** > **Policies**
2. Para a tabela `kommuchat_mvp`, crie uma política:

```sql
-- Permitir leitura para usuários autenticados
CREATE POLICY "Enable read access for authenticated users" ON kommuchat_mvp
FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir leitura para usuários anônimos (para demo)
CREATE POLICY "Enable read access for anonymous users" ON kommuchat_mvp
FOR SELECT USING (true);
```

### 4. Obter Credenciais

1. Vá em **Settings** > **API**
2. Copie:
   - **Project URL**
   - **anon public** key

### 5. Configurar .env

Edite o arquivo `.env` com as credenciais obtidas.

## Verificação

Após configurar, acesse:
- http://localhost:8080/dashboard

O alerta deve mudar de "dados simulados" para "dados reais do Supabase".

## Estrutura da Tabela kommuchat_mvp

A tabela deve ter os seguintes campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | SERIAL | ID único |
| nome | TEXT | Nome do paciente |
| telefone | TEXT | Telefone do paciente |
| chatid | TEXT | ID do chat WhatsApp |
| email | TEXT | Email do paciente |
| atende_humano | TEXT | Flag para atendimento humano |
| setdata | TEXT | Flag para consulta agendada |
| followup | TEXT | Flag para follow-up |
| follow | TEXT | Flag para follow |
| topoucall | TEXT | Flag para topou call |
| atendimentofinal | TEXT | Flag para atendimento final |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

## Solução de Problemas

### Erro "relation does not exist"
- Verifique se a tabela `kommuchat_mvp` foi criada
- Confirme o nome da tabela (case-sensitive)

### Erro "permission denied"
- Verifique as políticas de segurança
- Confirme se a chave anônima tem permissão de leitura

### Dados não aparecem
- Verifique se há dados na tabela
- Confirme se as credenciais estão corretas
- Verifique o console do navegador para erros
