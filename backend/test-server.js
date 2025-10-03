import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Servidor funcionando!', timestamp: new Date().toISOString() });
});

// Rota de status do WhatsApp
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: 'disconnected',
    isConnected: false,
    qrCode: null
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
  console.log(`📡 Teste: http://localhost:${PORT}/api/test`);
});