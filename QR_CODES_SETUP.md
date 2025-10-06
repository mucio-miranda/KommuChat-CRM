# Configuração de QR Codes WhatsApp

Este documento explica como configurar o sistema de upload e armazenamento de QR codes do WhatsApp para usuários no sistema CRM.

## 🎯 Objetivo

Permitir que administradores façam upload de QR codes PNG do WhatsApp durante a criação de usuários, salvando-os no Supabase Storage e vinculando-os aos usuários via UUID.

## 📋 Pré-requisitos

- Supabase configurado e funcionando
- Variáveis de ambiente configuradas (`VITE_CRM_SUPABASE_URL` e `VITE_CRM_SUPABASE_ANON_KEY`)
- Acesso ao Supabase Dashboard

## 🚀 Configuração

### 1. Criar Tabela no Banco de Dados

Execute o arquivo `create-qr-codes-table.sql` no Supabase SQL Editor:

```sql
-- Este arquivo cria a tabela whatsapp_qr_codes com todas as colunas necessárias
-- e configurações de segurança
```

### 2. Configurar Storage Bucket

Execute o arquivo `setup-qr-codes-storage.sql` no Supabase SQL Editor:

```sql
-- Este arquivo configura o bucket qr-codes e suas políticas de acesso
```

**Importante:** Você também precisa criar o bucket manualmente no Supabase Dashboard:

1. Acesse **Storage** no Supabase Dashboard
2. Clique em **New bucket**
3. Nome: `qr-codes`
4. Marque como **Public**
5. File size limit: `5MB`
6. Allowed MIME types: `image/png, image/jpeg, image/jpg, image/gif, image/webp`

### 3. Executar Script de Configuração (Opcional)

```bash
node setup-storage-bucket.js
```

Este script verifica e configura automaticamente o bucket e políticas.

### 4. Testar Configuração

```bash
node test-qr-codes-setup.js
```

Este script verifica se tudo está configurado corretamente.

## 🏗️ Estrutura da Solução

### Tabela `whatsapp_qr_codes`

```sql
CREATE TABLE whatsapp_qr_codes (
  id UUID PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id),
  qr_code_data TEXT,              -- Dados do QR code (opcional)
  qr_code_image_url TEXT,         -- URL da imagem no storage
  file_name TEXT,                 -- Nome do arquivo original
  file_size INTEGER,              -- Tamanho em bytes
  mime_type TEXT,                 -- Tipo MIME
  status TEXT DEFAULT 'pending',  -- Status: pending, scanned, connected, expired
  phone_number TEXT,              -- Número conectado (após escaneamento)
  user_name TEXT,                 -- Nome do usuário WhatsApp
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  expires_at TIMESTAMP            -- Data de expiração (5 minutos)
);
```

### Storage Bucket `qr-codes`

- **Estrutura de pastas:** `cliente-{cliente_id}/{arquivo}`
- **Políticas:** Acesso público para leitura, autenticado para escrita
- **Limites:** 5MB por arquivo, tipos de imagem permitidos

### Componentes React

1. **UserManagement.tsx** - Atualizado para suportar upload de QR codes
2. **QRCodeManager.tsx** - Novo componente para gerenciar QR codes
3. **supabase-crm.ts** - Funções auxiliares para operações com QR codes

## 🔧 Funcionalidades

### Upload de QR Code

- Upload de arquivos PNG, JPEG, JPG, GIF, WebP
- Validação de tamanho (máx. 5MB)
- Organização por cliente em pastas separadas
- Metadados salvos no banco de dados

### Gerenciamento

- Lista de QR codes por cliente
- Visualização de status (pendente, escaneado, conectado, expirado)
- Preview das imagens
- Exclusão de QR codes
- Controle de expiração (5 minutos)

### Integração

- QR codes vinculados aos usuários via `cliente_id`
- URLs públicas para acesso direto
- Histórico de uploads
- Status de conexão WhatsApp

## 📱 Como Usar

### 1. Criar Cliente com QR Code

1. Acesse `http://localhost:8080/admin/dashboard`
2. Clique em **Novo Cliente**
3. Preencha os dados básicos
4. Na seção **QR Code WhatsApp**, selecione um arquivo PNG
5. Clique em **Criar Cliente**

### 2. Gerenciar QR Codes Existentes

1. Na lista de clientes, cada cliente terá uma seção **QR Codes WhatsApp**
2. Use o botão **Novo QR Code** para adicionar mais
3. Visualize, baixe ou exclua QR codes existentes
4. Monitore o status de cada QR code

### 3. Verificar Status

- **Pendente:** QR code criado, aguardando escaneamento
- **Escaneado:** QR code foi escaneado pelo WhatsApp
- **Conectado:** WhatsApp conectado com sucesso
- **Expirado:** QR code expirou (5 minutos)

## 🐛 Solução de Problemas

### Erro: "Bucket not found"

```bash
# Verificar se o bucket existe
node test-qr-codes-setup.js

# Se não existir, criar manualmente no Supabase Dashboard
# Storage > New bucket > qr-codes (public)
```

### Erro: "Permission denied"

```sql
-- Verificar políticas no Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%qr-codes%';
```

### QR Code não aparece

1. Verificar se o arquivo foi enviado para o storage
2. Verificar se os metadados foram salvos na tabela
3. Verificar logs do console do navegador

### Upload falha

1. Verificar tamanho do arquivo (máx. 5MB)
2. Verificar tipo de arquivo (apenas imagens)
3. Verificar conexão com Supabase
4. Verificar políticas de acesso

## 🔒 Segurança

- Bucket público apenas para leitura
- Upload restrito a usuários autenticados
- Organização por cliente (isolamento)
- Validação de tipos de arquivo
- Limite de tamanho por arquivo
- Expiração automática de QR codes

## 📊 Monitoramento

### Logs Importantes

```javascript
// Upload bem-sucedido
console.log('✅ Upload realizado com sucesso:', uploadData);
console.log('🔗 URL pública gerada:', publicUrl);
console.log('✅ Metadados do QR Code salvos:', qrCodeData);

// Erros comuns
console.error('❌ Erro no upload do QR Code:', uploadError);
console.error('❌ Erro ao salvar metadados do QR Code:', qrCodeError);
```

### Métricas Úteis

- Número de QR codes por cliente
- Taxa de sucesso de uploads
- QR codes expirados
- Status de conexão WhatsApp

## 🚀 Próximos Passos

1. **Integração com WhatsApp API:** Conectar QR codes com a API do WhatsApp
2. **Notificações:** Alertas quando QR code é escaneado
3. **Histórico:** Log de todas as ações com QR codes
4. **Backup:** Sistema de backup automático
5. **Analytics:** Dashboard com estatísticas de uso

## 📞 Suporte

Se encontrar problemas:

1. Execute `node test-qr-codes-setup.js` para diagnóstico
2. Verifique os logs do console do navegador
3. Verifique as políticas no Supabase Dashboard
4. Consulte a documentação do Supabase Storage

---

**Versão:** 1.0  
**Data:** $(date)  
**Autor:** Sistema CRM KOMMU CHAT






