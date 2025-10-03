const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8081",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Estado do WhatsApp
let isConnected = false;
let qrCode = null;
let connectionStatus = 'disconnected';

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
    console.log('🔄 Iniciando conexão WhatsApp...');
    
    // Simular geração de QR Code
    const mockQRCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    qrCode = mockQRCode;
    connectionStatus = 'connecting';
    isConnected = false;
    
    // Enviar QR Code para o frontend
    io.emit('whatsapp-qr', {
      qrCode: mockQRCode,
      status: 'connecting'
    });
    
    res.json({ message: 'Iniciando conexão WhatsApp...' });
    console.log('✅ QR Code simulado enviado');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    isConnected = false;
    connectionStatus = 'disconnected';
    qrCode = null;
    
    io.emit('whatsapp-disconnected');
    res.json({ message: 'WhatsApp desconectado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    
    if (!isConnected) {
      return res.status(400).json({ error: 'WhatsApp não está conectado' });
    }
    
    console.log(`📤 Enviando mensagem para ${phone}: ${message}`);
    res.json({ message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/whatsapp/chats', async (req, res) => {
  try {
    if (!isConnected) {
      return res.status(400).json({ error: 'WhatsApp não está conectado' });
    }
    
    // Simular chats
    const mockChats = [
      {
        id: '5511999999999@s.whatsapp.net',
        name: 'Maria Silva',
        subject: 'Maria Silva',
        lastMessage: {
          message: { conversation: 'Obrigada pela consulta!' },
          messageTimestamp: Date.now() / 1000
        },
        unreadCount: 2
      },
      {
        id: '5511888888888@s.whatsapp.net',
        name: 'João Santos',
        subject: 'João Santos',
        lastMessage: {
          message: { conversation: 'Posso reagendar para amanhã?' },
          messageTimestamp: Date.now() / 1000
        },
        unreadCount: 0
      }
    ];
    
    res.json(mockChats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);
  
  // Enviar status atual quando cliente conectar
  socket.emit('whatsapp-status', {
    status: connectionStatus,
    isConnected,
    qrCode
  });
  
  // Simular conexão após 5 segundos
  setTimeout(() => {
    if (connectionStatus === 'connecting') {
      isConnected = true;
      connectionStatus = 'connected';
      qrCode = null;
      
      const userInfo = {
        phoneNumber: '+5511999999999',
        name: 'WhatsApp Teste',
        status: 'connected'
      };
      
      io.emit('whatsapp-connected', userInfo);
      console.log('✅ WhatsApp conectado (simulado):', userInfo);
    }
  }, 5000);
  
  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
  });
});

// Iniciar servidor
const PORT = 3001;

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Frontend: http://localhost:8081`);
  console.log(`🔧 Backend: http://localhost:${PORT}`);
  console.log(`📊 Status: http://localhost:${PORT}/api/whatsapp/status`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});