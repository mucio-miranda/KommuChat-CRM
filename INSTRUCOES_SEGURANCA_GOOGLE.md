# 🔒 Instruções de Segurança - Google Calendar

## ✅ Sistema de Segurança Implementado

O sistema agora usa **criptografia AES-256** para proteger todas as credenciais sensíveis do Google Calendar.

## 🚨 AÇÃO NECESSÁRIA - Execute no Supabase CRM

**Acesse:** https://wywzdtyjzzmcehrsalvn.supabase.co

### 1. Vá para SQL Editor
### 2. Execute este script:

```sql
-- Script completo para configurar tabelas seguras do Google Calendar
-- Execute este script no SQL Editor do Supabase CRM

-- 1. Criar tabela google_credentials (já criptografada pelo aplicativo)
CREATE TABLE IF NOT EXISTS google_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL,
  client_id TEXT NOT NULL, -- Criptografado pelo aplicativo
  client_secret TEXT NOT NULL, -- Criptografado pelo aplicativo
  redirect_uri TEXT NOT NULL,
  calendar_id TEXT,
  configured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cliente_id)
);

-- 2. Criar tabela google_calendar_tokens
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  access_token TEXT NOT NULL, -- Criptografado pelo aplicativo
  refresh_token TEXT, -- Criptografado pelo aplicativo
  token_type TEXT DEFAULT 'Bearer',
  expires_in INTEGER,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE google_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- 4. Políticas permissivas para desenvolvimento
CREATE POLICY "Permitir todas as operações google_credentials" ON google_credentials
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todas as operações google_calendar_tokens" ON google_calendar_tokens
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Verificar se as tabelas foram criadas
SELECT 
  'google_credentials' as tabela,
  COUNT(*) as registros
FROM google_credentials
UNION ALL
SELECT 
  'google_calendar_tokens' as tabela,
  COUNT(*) as registros
FROM google_calendar_tokens;
```

## 🔒 Recursos de Segurança Implementados

### ✅ **Criptografia AES-256**
- **Client Secret** - Criptografado antes de salvar no banco
- **Access Tokens** - Criptografados antes de salvar no banco
- **Refresh Tokens** - Criptografados antes de salvar no banco

### ✅ **Chave de Criptografia**
- Configurada via `VITE_ENCRYPTION_KEY` no arquivo `.env`
- Chave atual: `your_secure_encryption_key_here`

### ✅ **Serviços Seguros**
- `secureGoogleCredentialsService` - Para credenciais
- `supabaseGoogleTokensService` - Para tokens (com criptografia)

### ✅ **Interface Segura**
- Indicadores visuais de segurança (🔒)
- Alertas sobre criptografia
- Dados sensíveis mascarados na interface

## 🎯 Próximos Passos

1. **Execute o script SQL acima**
2. **Acesse:** http://localhost:8081
3. **Teste a criação de usuário** com credenciais Google
4. **Verifique se não há mais erros 400** do Google

## ⚠️ Importante

- **NUNCA** compartilhe a chave de criptografia
- **SEMPRE** use HTTPS em produção
- **CONSIDERE** usar AWS KMS ou Azure Key Vault para chaves em produção
- **ROTACIONE** as chaves periodicamente

## 🔍 Verificação

Após executar o script, você deve ver:
- ✅ Tabelas criadas sem erros
- ✅ Políticas RLS aplicadas
- ✅ Contagem de registros (deve ser 0 inicialmente)

**O sistema agora está MUITO mais seguro! 🔒**
