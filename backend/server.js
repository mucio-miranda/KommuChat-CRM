import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { Boom } from '@hapi/boom';
import pino from 'pino';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:8080", "http://localhost:8081", "http://localhost:8082", "http://localhost:8083", "http://localhost:5173", "http://localhost:3000", "http://localhost:4173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:8080", "http://localhost:8081", "http://localhost:8082", "http://localhost:8083", "http://localhost:5173", "http://localhost:3000", "http://localhost:4173"],
  credentials: true
}));
app.use(express.json());

// Logger
const logger = pino({ level: 'info' });

// Estado do WhatsApp
let sock = null;
let isConnected = false;
let qrCode = null;
let connectionStatus = 'disconnected';
let connectionTimeout = null;
let isConnecting = false;

// Função para iniciar WhatsApp
async function startWhatsApp() {
  try {
    console.log('🔄 Iniciando WhatsApp...');
    
    // Se já estiver tentando conectar, não iniciar novamente
    if (isConnecting) {
      console.log('⚠️ WhatsApp já está em processo de conexão');
      return;
    }
    
    // Se já estiver conectado, não iniciar novamente
    if (connectionStatus === 'connected' && isConnected) {
      console.log('⚠️ WhatsApp já está conectado');
      return;
    }
    
    isConnecting = true;
    
    // Limpar timeout anterior se existir
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    
    console.log('📁 Carregando estado de autenticação...');
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    console.log('✅ Estado de autenticação carregado:', { hasCreds: !!state.creds });
    
    // Se já existe um socket, desconectar primeiro
    if (sock) {
      console.log('🔄 Desconectando socket anterior...');
      await sock.logout();
      sock = null;
    }
    
    console.log('🔌 Criando socket Baileys...');
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true, // Habilitar QR no terminal para debug
      logger: logger,
      browser: ['CRM KOMMUCHAT', 'Desktop', '1.0.0']
    });
    console.log('✅ Socket Baileys criado');

    // Evento de atualização de conexão
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr, isNewLogin, isOnline } = update;
      
      console.log('📡 Status da conexão:', {
        connection,
        isNewLogin,
        isOnline,
        hasQR: !!qr,
        lastDisconnect: lastDisconnect?.error?.message || 'none'
      });
      
      if (qr) {
        console.log('📱 Gerando QR Code...');
        try {
          qrCode = await QRCode.toDataURL(qr, {
            width: 300,
            margin: 4,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
          });
          
          connectionStatus = 'connecting';
          isConnected = false;
          
          // Enviar QR Code para o frontend
          const qrData = {
            qrCode,
            status: 'connecting'
          };
          
          console.log('📤 Enviando QR Code para frontend:', { 
            hasQrCode: !!qrCode, 
            status: 'connecting' 
          });
          io.emit('whatsapp-qr', qrData);
          
          // Timeout para reconectar se não conectar em 10 minutos
          connectionTimeout = setTimeout(() => {
            console.log('⏰ Timeout de conexão - reiniciando...');
            if (sock && !isConnected) {
              sock.logout();
              setTimeout(() => startWhatsApp(), 2000);
            }
          }, 600000); // 10 minutos - tempo suficiente para escanear QR
          
          console.log('✅ QR Code gerado e enviado');
        } catch (error) {
          console.error('❌ Erro ao gerar QR Code:', error);
        }
      } else if (connection === 'connecting' && !qr) {
        // Se está conectando mas não tem QR, aguardar um pouco
        console.log('🔄 Aguardando QR Code...');
        connectionStatus = 'connecting';
        isConnected = false;
        
        const connectingData = {
          status: 'connecting',
          isConnected: false
        };
        console.log('📤 Enviando status conectando:', connectingData);
        io.emit('whatsapp-status', connectingData);
      }
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        console.log('🔌 Conexão fechada. Reconectando:', shouldReconnect);
        console.log('🔍 Detalhes do erro:', lastDisconnect?.error);
        
        connectionStatus = 'disconnected';
        isConnected = false;
        isConnecting = false;
        qrCode = null;
        
        // Limpar timeout se existir
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        
        const statusData = {
          status: 'disconnected',
          isConnected: false
        };
        console.log('📤 Enviando status desconectado:', statusData);
        io.emit('whatsapp-status', statusData);
        
        // Não reconectar automaticamente - deixar o usuário decidir
        console.log('⏸️ Conexão fechada. Aguardando ação do usuário para reconectar.');
      } else if (connection === 'open') {
        console.log('✅ WhatsApp conectado!');
        
        // Limpar timeout de conexão
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        
        connectionStatus = 'connected';
        isConnected = true;
        isConnecting = false;
        qrCode = null;
        
        const userInfo = {
          phoneNumber: sock.user?.id?.replace('@s.whatsapp.net', ''),
          name: sock.user?.name || 'WhatsApp User',
          status: 'connected'
        };
        
        io.emit('whatsapp-connected', userInfo);
        
        console.log('👤 Usuário conectado:', userInfo);
      } else if (connection === 'connecting') {
        console.log('🔄 Conectando...');
        connectionStatus = 'connecting';
        isConnected = false;
        
        const connectingData = {
          status: 'connecting',
          isConnected: false
        };
        console.log('📤 Enviando status conectando:', connectingData);
        io.emit('whatsapp-status', connectingData);
      }
    });

    // Salvar credenciais quando necessário
    sock.ev.on('creds.update', saveCreds);

    // Evento de mensagens recebidas
    sock.ev.on('messages.upsert', (m) => {
      console.log('📨 Mensagem recebida:', m);
      io.emit('whatsapp-message', m);
    });

    // Evento de chats atualizados
    sock.ev.on('chats.update', (chats) => {
      console.log('💬 Chats atualizados:', chats.length);
      io.emit('whatsapp-chats', chats);
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar WhatsApp:', error);
    connectionStatus = 'error';
    isConnecting = false;
    io.emit('whatsapp-error', { error: error.message });
  }
}

// Rotas da API
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    isConnected,
    status: connectionStatus,
    qrCode: qrCode || null
  });
});

app.post('/api/whatsapp/connect', async (req, res) => {
  try {
    console.log('📞 Recebida solicitação de conexão WhatsApp');
    console.log('🔍 Estado atual:', { 
      hasSock: !!sock, 
      connectionStatus, 
      isConnected 
    });
    
    if (!sock || connectionStatus === 'disconnected') {
      console.log('🚀 Iniciando nova conexão WhatsApp...');
      await startWhatsApp();
      res.json({ message: 'Iniciando conexão WhatsApp...' });
    } else {
      console.log('⚠️ WhatsApp já está em processo de conexão');
      res.json({ message: 'WhatsApp já está conectando/conectado' });
    }
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    if (sock) {
      // Limpar timeout se existir
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      
      await sock.logout();
      sock = null;
      isConnected = false;
      connectionStatus = 'disconnected';
      qrCode = null;
      
      io.emit('whatsapp-disconnected');
      res.json({ message: 'WhatsApp desconectado' });
    } else {
      res.json({ message: 'WhatsApp não estava conectado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    
    if (!sock || !isConnected) {
      return res.status(400).json({ error: 'WhatsApp não está conectado' });
    }
    
    const phoneNumber = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    
    await sock.sendMessage(phoneNumber, { text: message });
    
    res.json({ message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/whatsapp/chats', async (req, res) => {
  try {
    if (!sock || !isConnected) {
      return res.status(400).json({ error: 'WhatsApp não está conectado' });
    }
    
    const chats = await sock.getChats();
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/clear-auth', async (req, res) => {
  try {
    console.log('🧹 Limpando dados de autenticação...');
    
    // Limpar timeout se existir
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    
    // Desconectar se estiver conectado
    if (sock) {
      await sock.logout();
      sock = null;
    }
    
    // Limpar estado
    isConnected = false;
    connectionStatus = 'disconnected';
    qrCode = null;
    isConnecting = false;
    
    // Limpar arquivos de autenticação
    const fs = await import('fs');
    const path = await import('path');
    
    const authDir = './auth_info_baileys';
    if (fs.existsSync(authDir)) {
      const files = fs.readdirSync(authDir);
      for (const file of files) {
        fs.unlinkSync(path.join(authDir, file));
      }
      fs.rmdirSync(authDir);
    }
    
    io.emit('whatsapp-disconnected');
    
    res.json({ message: 'Dados de autenticação limpos. Reinicie a conexão.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/stop', async (req, res) => {
  try {
    console.log('🛑 Parando conexão WhatsApp...');
    
    // Limpar timeout se existir
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    
    // Desconectar se estiver conectado
    if (sock) {
      await sock.logout();
      sock = null;
    }
    
    // Limpar estado
    isConnected = false;
    connectionStatus = 'disconnected';
    qrCode = null;
    isConnecting = false;
    
    io.emit('whatsapp-disconnected');
    
    res.json({ message: 'Conexão WhatsApp parada.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// WebSocket connections
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);
  console.log('🌐 Origem da conexão:', socket.handshake.headers.origin);
  console.log('🔗 Transporte:', socket.conn.transport.name);
  
  // Enviar status atual quando cliente conectar
  const currentStatus = {
    status: connectionStatus,
    isConnected,
    qrCode
  };
  
  console.log('📤 Enviando status atual para cliente:', currentStatus);
  socket.emit('whatsapp-status', currentStatus);
  
  socket.on('disconnect', (reason) => {
    console.log('🔌 Cliente desconectado:', socket.id, 'Razão:', reason);
  });
  
  socket.on('connect_error', (error) => {
    console.log('❌ Erro de conexão no servidor:', error);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Frontend: http://localhost:8080`);
  console.log(`🔧 Backend: http://localhost:${PORT}`);
  console.log(`📱 WhatsApp será iniciado quando solicitado pelo frontend`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando servidor...');
  
  // Limpar timeout se existir
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
  }
  
  if (sock) {
    await sock.logout();
  }
  
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});
