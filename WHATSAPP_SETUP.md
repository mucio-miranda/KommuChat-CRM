# Integração WhatsApp - Guia de Implementação

## 📱 Visão Geral

Este sistema implementa uma integração completa com WhatsApp que permite:
- Conectar conta WhatsApp via QR Code
- Sincronizar lista de chats
- Visualizar mensagens
- Enviar mensagens
- Integrar com o sistema de pacientes

## 🔧 Implementação Atual

### Estrutura Criada

1. **Contexto WhatsApp** (`src/contexts/WhatsAppContext.tsx`)
   - Gerencia estado da conexão
   - Controla lista de chats
   - Simula funcionalidades (QR Code, mensagens)

2. **Componente de Setup** (`src/components/WhatsAppSetup.tsx`)
   - Interface para conectar WhatsApp
   - Exibição de QR Code
   - Status da conexão

3. **Página WhatsApp** (`src/pages/WhatsApp.tsx`)
   - Lista de chats
   - Área de mensagens
   - Interface completa

4. **Integração Dashboard** (`src/pages/Dashboard.tsx`)
   - Seção de chats WhatsApp
   - Status da conexão

## 🚀 Para Implementação Real

### Opção 1: WhatsApp Business API (Recomendado)

```javascript
// Exemplo de implementação real
const connectWhatsApp = async () => {
  try {
    // 1. Gerar QR Code via API
    const response = await fetch('/api/whatsapp/qr-code', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { qrCode, sessionId } = await response.json();
    
    // 2. Exibir QR Code
    setConnection({ qrCode, status: 'connecting' });
    
    // 3. Polling para verificar conexão
    const checkConnection = setInterval(async () => {
      const status = await fetch(`/api/whatsapp/status/${sessionId}`);
      if (status.connected) {
        clearInterval(checkConnection);
        setConnection({ isConnected: true, phoneNumber: status.phone });
        loadChats();
      }
    }, 2000);
    
  } catch (error) {
    console.error('Erro ao conectar:', error);
  }
};
```

### Opção 2: WhatsApp Web API

```javascript
// Usando bibliotecas como whatsapp-web.js
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
  // Exibir QR Code
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('WhatsApp conectado!');
  // Carregar chats
  loadChats();
});
```

### Opção 3: Serviços Terceiros

#### Baileys (Node.js)
```bash
npm install @whiskeysockets/baileys
```

#### Venom-Bot
```bash
npm install venom-bot
```

#### WhatsApp-Web.js
```bash
npm install whatsapp-web.js
```

## 🔌 APIs Necessárias

### Backend Endpoints

```javascript
// Rotas necessárias
POST /api/whatsapp/connect     // Iniciar conexão
GET  /api/whatsapp/qr-code     // Obter QR Code
GET  /api/whatsapp/status      // Status da conexão
GET  /api/whatsapp/chats       // Listar chats
GET  /api/whatsapp/messages/:chatId  // Mensagens do chat
POST /api/whatsapp/send        // Enviar mensagem
DELETE /api/whatsapp/disconnect // Desconectar
```

### Exemplo de Implementação Backend

```javascript
// Express.js + Socket.io
const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
const clients = new Map(); // Múltiplas instâncias

app.post('/api/whatsapp/connect', async (req, res) => {
  const sessionId = req.body.sessionId;
  
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: sessionId })
  });
  
  client.on('qr', async (qr) => {
    const qrCodeDataURL = await qrcode.toDataURL(qr);
    // Enviar via WebSocket
    io.to(sessionId).emit('qr-code', qrCodeDataURL);
  });
  
  client.on('ready', () => {
    clients.set(sessionId, client);
    io.to(sessionId).emit('connected', {
      phoneNumber: client.info.wid.user
    });
  });
  
  client.initialize();
  res.json({ sessionId });
});
```

## 🔒 Considerações de Segurança

### 1. Autenticação
```javascript
// Middleware de autenticação
const authenticateWhatsApp = (req, res, next) => {
  const token = req.headers.authorization;
  if (!isValidToken(token)) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  next();
};
```

### 2. Rate Limiting
```javascript
// Limitar envio de mensagens
const rateLimit = require('express-rate-limit');

const messageLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 mensagens por 15 min
});

app.post('/api/whatsapp/send', messageLimit, sendMessage);
```

### 3. Validação de Dados
```javascript
// Validar números de telefone
const validatePhone = (phone) => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};
```

## 📊 Banco de Dados

### Tabela WhatsApp Sessions
```sql
CREATE TABLE whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(255) UNIQUE,
  phone_number VARCHAR(20),
  status VARCHAR(20) DEFAULT 'disconnected',
  qr_code TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela WhatsApp Chats
```sql
CREATE TABLE whatsapp_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) REFERENCES whatsapp_sessions(session_id),
  chat_id VARCHAR(255),
  name VARCHAR(255),
  phone VARCHAR(20),
  is_group BOOLEAN DEFAULT FALSE,
  last_message TEXT,
  last_message_time TIMESTAMP,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Próximos Passos

1. **Escolher Solução**: Decidir entre WhatsApp Business API, WhatsApp Web API ou serviço terceiro
2. **Implementar Backend**: Criar APIs para gerenciar conexões e mensagens
3. **Configurar WebSocket**: Para comunicação em tempo real
4. **Integrar com Supabase**: Salvar chats e mensagens no banco
5. **Testes**: Implementar testes unitários e de integração
6. **Deploy**: Configurar ambiente de produção

## 📝 Notas Importantes

- **WhatsApp Business API**: Mais estável, mas requer aprovação do Facebook
- **WhatsApp Web API**: Mais flexível, mas pode ser instável
- **Serviços Terceiros**: Mais fácil de implementar, mas dependência externa
- **Compliance**: Verificar políticas do WhatsApp para uso comercial
- **Backup**: Implementar backup de mensagens importantes

## 🔗 Recursos Úteis

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [WhatsApp-Web.js Documentation](https://wwebjs.dev/)
- [Venom-Bot Documentation](https://github.com/orkestral/venom)

