# Página de Automatizações - WhatsApp

## 📱 Funcionalidades Implementadas

### 1. Página de Automatizações
- **Localização**: `/automatizacoes`
- **Acesso**: Disponível na sidebar principal
- **Funcionalidade**: Interface completa para gerenciar conexões e automações do WhatsApp

### 2. Conexão WhatsApp
- **QR Code**: Exibição automática do QR code quando solicitado
- **Instruções**: Guia passo-a-passo para conectar o WhatsApp
- **Status**: Indicadores visuais do status da conexão
- **Armazenamento**: QR codes são salvos no banco de dados

### 3. Recursos de Automação
- **Mensagens Automáticas**: Para novos pacientes
- **Lembretes de Consulta**: Antes das consultas agendadas
- **Follow-up Pós Consulta**: Acompanhamento após consultas
- **Campanhas de Marketing**: Promocionais para a base de clientes

## 🗄️ Banco de Dados

### Tabela: `whatsapp_qr_codes`
```sql
CREATE TABLE whatsapp_qr_codes (
    id UUID PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id),
    qr_code_data TEXT NOT NULL,
    qr_code_image TEXT, -- Base64 da imagem PNG
    status TEXT CHECK (status IN ('pending', 'scanned', 'connected', 'expired')),
    phone_number TEXT,
    user_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);
```

### Funções Disponíveis
- `saveWhatsAppQRCode()`: Salva QR code no banco
- `updateWhatsAppQRCodeStatus()`: Atualiza status da conexão
- `getActiveWhatsAppQRCode()`: Busca QR code ativo

## 🔧 Como Usar

### 1. Acessar a Página
1. Faça login no sistema
2. Clique em "Automatizações" na sidebar
3. A página será carregada com todas as funcionalidades

### 2. Conectar WhatsApp
1. Clique em "Conectar WhatsApp"
2. Aguarde o QR code aparecer
3. Abra o WhatsApp no celular
4. Vá em "Menu" > "Dispositivos conectados"
5. Toque em "Conectar um dispositivo"
6. Escaneie o QR code exibido

### 3. Gerenciar Automações
- Cada recurso mostra se está ativo ou inativo
- Botão de configurações para cada automação
- Status baseado na conexão do WhatsApp

## 🎨 Interface

### Status da Conexão
- **Verde**: Conectado
- **Amarelo**: Conectando
- **Vermelho**: Erro
- **Cinza**: Desconectado

### Recursos de Automação
- Cards organizados em grid responsivo
- Ícones intuitivos para cada funcionalidade
- Status visual claro (Ativo/Inativo)
- Botões de configuração

## 🔄 Integração com Backend

### WebSocket Events
- `whatsapp-qr`: Recebe QR code
- `whatsapp-connected`: Confirma conexão
- `whatsapp-disconnected`: Notifica desconexão
- `whatsapp-error`: Reporta erros

### API Endpoints
- `POST /api/whatsapp/connect`: Inicia conexão
- `POST /api/whatsapp/disconnect`: Desconecta
- `GET /api/whatsapp/chats`: Lista conversas

## 📋 Próximas Funcionalidades

### Planejadas
- **Integração com Calendário**: Sincronização automática
- **Templates de Mensagem**: Criação e gerenciamento
- **Relatórios de Envio**: Métricas de campanhas
- **Chatbot Inteligente**: IA para respostas automáticas

## 🛠️ Configuração

### Variáveis de Ambiente
```env
VITE_CRM_SUPABASE_URL=your_crm_supabase_url
VITE_CRM_SUPABASE_ANON_KEY=your_crm_supabase_anon_key
```

### Backend
- Servidor WebSocket na porta 3001
- API REST para comunicação
- Integração com Baileys para WhatsApp

## 🔒 Segurança

### RLS (Row Level Security)
- Clientes só acessam seus próprios QR codes
- Usuários só veem dados do seu cliente
- Políticas de acesso configuradas

### Validação
- QR codes expiram em 5 minutos
- Validação de status de conexão
- Tratamento de erros robusto

## 📱 Compatibilidade

### Dispositivos
- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Android Chrome)
- ✅ Tablet (iPad, Android tablets)

### WhatsApp
- ✅ WhatsApp Web
- ✅ WhatsApp Business
- ✅ Múltiplas contas (por cliente)

## 🚀 Deploy

### Pré-requisitos
1. Banco de dados configurado
2. Tabela `whatsapp_qr_codes` criada
3. Backend WebSocket rodando
4. Variáveis de ambiente configuradas

### Comandos
```bash
# Instalar dependências
npm install

# Executar SQL de criação da tabela
psql -f create-whatsapp-qr-codes-table.sql

# Iniciar aplicação
npm run dev
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Confirme se o backend está rodando
3. Valide as configurações do banco
4. Teste a conexão WebSocket

