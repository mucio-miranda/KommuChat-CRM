# 📱 WhatsApp Backend com Baileys

Backend Node.js que usa a biblioteca Baileys para conectar realmente ao WhatsApp e gerar QR Codes funcionais.

## 🚀 **Como Executar**

### **1. Instalar Dependências**
```bash
cd backend
npm install
```

### **2. Executar o Servidor**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

### **3. Acessar**
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:8081

## 🔧 **Funcionalidades**

### **✅ QR Code Real**
- Gerado pelo WhatsApp via Baileys
- Escaneável com WhatsApp real
- Expira automaticamente

### **✅ Conexão Real**
- Conecta realmente ao WhatsApp
- Sincroniza chats e mensagens
- Envia e recebe mensagens

### **✅ WebSocket**
- Comunicação em tempo real
- Atualizações automáticas
- Status de conexão

### **✅ APIs REST**
- `/api/whatsapp/status` - Status da conexão
- `/api/whatsapp/connect` - Iniciar conexão
- `/api/whatsapp/disconnect` - Desconectar
- `/api/whatsapp/send` - Enviar mensagem
- `/api/whatsapp/chats` - Listar chats

## 📱 **Como Usar**

### **1. Iniciar Backend**
```bash
npm run dev
```

### **2. Iniciar Frontend**
```bash
cd ..
npm run dev
```

### **3. Conectar WhatsApp**
1. Acesse http://localhost:8081/whatsapp
2. Clique "Conectar WhatsApp"
3. Escaneie o QR Code com seu celular
4. Aguarde a conexão

## ⚠️ **Limitações**

### **Baileys (Não Oficial)**
- Pode parar de funcionar
- Contra termos do WhatsApp
- Instável com updates
- Risco de banimento

### **Alternativas Oficiais**
- **WhatsApp Business API** (pago, estável)
- **WhatsApp Cloud API** (pago, oficial)

## 🔒 **Segurança**

### **Dados Salvos**
- `auth_info_baileys/` - Credenciais do WhatsApp
- **NÃO compartilhe** estes arquivos

### **Recomendações**
- Use apenas para desenvolvimento
- Não use em produção
- Faça backup das credenciais

## 📊 **Logs**

### **Console**
```
🚀 Servidor rodando na porta 3001
📱 Frontend: http://localhost:8081
🔧 Backend: http://localhost:3001
🔄 Iniciando WhatsApp...
📱 Gerando QR Code...
✅ QR Code gerado e enviado
✅ WhatsApp conectado!
👤 Usuário conectado: { phoneNumber: '+5511999999999', name: 'WhatsApp User' }
```

### **Eventos WebSocket**
- `whatsapp-qr` - QR Code gerado
- `whatsapp-connected` - Conectado
- `whatsapp-disconnected` - Desconectado
- `whatsapp-error` - Erro
- `whatsapp-chats` - Chats atualizados

## 🛠️ **Desenvolvimento**

### **Estrutura**
```
backend/
├── server.js          # Servidor principal
├── config.js          # Configurações
├── package.json       # Dependências
└── auth_info_baileys/ # Credenciais (gerado automaticamente)
```

### **Dependências Principais**
- `@whiskeysockets/baileys` - Biblioteca WhatsApp
- `express` - Servidor HTTP
- `socket.io` - WebSocket
- `qrcode` - Geração de QR Code

## 🚨 **Troubleshooting**

### **QR Code não aparece**
1. Verifique se o backend está rodando
2. Verifique o console para erros
3. Reinicie o servidor

### **Conexão falha**
1. Verifique sua internet
2. Tente desconectar e reconectar
3. Limpe as credenciais em `auth_info_baileys/`

### **Mensagens não enviam**
1. Verifique se está conectado
2. Verifique o formato do número
3. Verifique os logs do console

## 📝 **Notas Importantes**

- **Baileys é não oficial** - Use por sua conta e risco
- **Pode parar de funcionar** - WhatsApp pode bloquear
- **Não use em produção** - Use WhatsApp Business API
- **Faça backup** - Das credenciais salvas

## 🎯 **Próximos Passos**

1. **Testar conexão** - Verificar se funciona
2. **Implementar features** - Adicionar funcionalidades
3. **Migrar para oficial** - WhatsApp Business API
4. **Deploy** - Configurar ambiente de produção

