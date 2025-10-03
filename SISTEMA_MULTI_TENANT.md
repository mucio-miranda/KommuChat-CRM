# 🏗️ Sistema Multi-Tenant KommuChat

## 📋 Visão Geral

O sistema KommuChat foi projetado como uma solução multi-tenant onde cada cliente (clínica/profissional) tem:
- **Login pré-configurado** com Google Calendar integrado
- **Tabelas específicas** para seus dados (isolamento total)
- **QR Code do WhatsApp** pré-configurado
- **Configurações personalizadas** por cliente

## 🚀 Setup Inicial

### 1. Configurar Variáveis de Ambiente

```bash
export VITE_SUPABASE_URL="sua_url_do_supabase"
export SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key"
```

### 2. Executar Setup Completo

```bash
node setup-complete-system.js
```

Este script executa:
- ✅ Schema principal do banco
- ✅ Funções para tabelas específicas
- ✅ Storage para QR codes
- ✅ Primeiro usuário demo

## 👥 Gerenciamento de Clientes

### Acessar Interface
- URL: `/usuarios`
- Funcionalidade: Criar e gerenciar clientes

### Criar Novo Cliente

**Campos obrigatórios:**
- **Nome da Clínica**: Nome da clínica ou profissional
- **Email de Login**: Email para acesso ao sistema
- **Senha**: Senha para o login
- **Telefone**: Telefone de contato
- **Email Google Calendar**: Email do Google Calendar pré-configurado

**Campos opcionais:**
- **Tabela Supabase**: Seleção de uma tabela existente do Supabase
- **QR Code WhatsApp**: Upload do QR code para conectar automaticamente

### O que acontece ao criar um cliente:

1. **Cliente criado** na tabela `clientes`
2. **Usuário criado** no Supabase Auth com email/senha
3. **Usuário admin** criado na tabela `usuarios`
4. **Configurações** criadas na tabela `configuracoes_cliente`
5. **Tabela selecionada** associada ao cliente (se especificada)
6. **QR Code** enviado para storage (se fornecido)
7. **Referência da tabela** salva nas configurações

## 🗄️ Estrutura do Banco

### Tabelas Principais
- `clientes` - Dados dos clientes
- `usuarios` - Usuários do sistema
- `configuracoes_cliente` - Configurações por cliente

### Tabelas por Cliente
- Cada cliente pode ter uma **tabela específica** selecionada
- A tabela é escolhida de uma **lista de tabelas existentes** no Supabase
- Se nenhuma tabela for selecionada, o cliente usa as tabelas padrão

**Exemplos:**
- Cliente "Clínica ABC" → Tabela "pacientes_clinica_abc"
- Cliente "Dr. João" → Tabela "agendamentos_joao"
- Cliente sem tabela → Usa tabelas padrão do sistema

### Storage
- `qr-codes` - Bucket para QR codes do WhatsApp

## 🔧 Configurações por Cliente

Cada cliente tem configurações específicas:

```sql
-- Google Calendar
google_calendar_enabled: true
google_calendar_email: "calendario@clinica.com"

-- WhatsApp
whatsapp_enabled: true
whatsapp_qr_code_url: "https://storage.../qr_code.png"

-- Clínica
clinica_nome: "Clínica ABC"
clinica_telefone: "(11) 99999-9999"

-- Tabelas
tabela_supabase: "clinica_abc"

-- Agendamentos
agendamento_duracao_padrao: 60
lembrete_whatsapp_24h: true
```

## 📱 Fluxo de Uso para Clientes

### 1. Cliente recebe credenciais
- Email de login
- Senha
- Instruções de acesso

### 2. Cliente acessa o sistema
- Faz login com as credenciais
- Google Calendar já está conectado
- WhatsApp precisa ser conectado (se QR code foi fornecido)

### 3. Cliente usa o sistema
- Gerencia pacientes
- Agenda consultas
- Recebe lembretes automáticos
- Sincroniza com Google Calendar

## 🛠️ Funções Úteis

### SQL Functions Disponíveis

```sql
-- Criar tabelas para um cliente
SELECT create_cliente_tables('cliente_id', 'table_prefix');

-- Obter URL do QR code
SELECT get_cliente_qr_code_url('cliente_id');

-- Atualizar URL do QR code
SELECT update_cliente_qr_code_url('cliente_id', 'new_url');

-- Listar QR codes de um cliente
SELECT list_cliente_qr_codes('cliente_id');

-- Listar tabelas de um cliente
SELECT list_cliente_tables('cliente_id');
```

## 🔒 Segurança

### Row Level Security (RLS)
- ✅ Habilitado em todas as tabelas
- ✅ Usuários só veem dados da sua clínica
- ✅ Isolamento total entre clientes

### Storage
- ✅ QR codes são públicos para visualização
- ✅ Upload restrito a usuários autenticados
- ✅ Limite de 5MB por arquivo

## 📊 Monitoramento

### Verificar Status do Sistema

```sql
-- Contar clientes
SELECT COUNT(*) FROM clientes;

-- Contar usuários
SELECT COUNT(*) FROM usuarios;

-- Verificar configurações
SELECT cliente_id, chave, valor 
FROM configuracoes_cliente 
WHERE chave = 'google_calendar_enabled';

-- Verificar QR codes
SELECT COUNT(*) FROM storage.objects 
WHERE bucket_id = 'qr-codes';
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro ao criar cliente**
   - Verificar se Supabase Auth está configurado
   - Verificar permissões do service role key

2. **QR Code não aparece**
   - Verificar se bucket 'qr-codes' foi criado
   - Verificar políticas de storage

3. **Tabelas específicas não criadas**
   - Verificar se função `create_cliente_tables` existe
   - Verificar permissões de execução

### Logs Úteis

```sql
-- Ver últimas configurações criadas
SELECT * FROM configuracoes_cliente 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver usuários criados recentemente
SELECT * FROM usuarios 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🎯 Próximos Passos

1. **Configurar credenciais** do Google Calendar
2. **Testar criação** de novos clientes
3. **Configurar Evolution API** para WhatsApp
4. **Implementar sincronização** automática
5. **Adicionar relatórios** por cliente

---

**Sistema pronto para venda de logins pré-configurados!** 🚀
