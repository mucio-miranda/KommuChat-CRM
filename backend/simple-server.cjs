// Servidor simples sem dependências externas
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8081');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Lidar com OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  console.log(`${method} ${path}`);

  // Rotas da API
  if (path === '/api/whatsapp/status') {
    res.writeHead(200);
    res.end(JSON.stringify({
      isConnected: false,
      status: 'disconnected',
      qrCode: null
    }));
  }
  else if (path === '/api/whatsapp/connect' && method === 'POST') {
    console.log('📱 Solicitação de conexão recebida');
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Backend funcionando! Conectando ao WhatsApp...',
      status: 'connecting'
    }));
  }
  else if (path === '/api/whatsapp/disconnect' && method === 'POST') {
    console.log('🔌 Solicitação de desconexão recebida');
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Desconexão solicitada'
    }));
  }
  else if (path === '/api/whatsapp/chats') {
    console.log('💬 Chats solicitados');
    res.writeHead(200);
    res.end(JSON.stringify([]));
  }
  else if (path === '/api/whatsapp/send' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      console.log('📨 Mensagem solicitada:', body);
      res.writeHead(200);
      res.end(JSON.stringify({
        message: 'Mensagem enviada (simulado)'
      }));
    });
  }
  else {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Endpoint não encontrado',
      path: path,
      method: method
    }));
  }
});

const PORT = 3001;

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Frontend: http://localhost:8081`);
  console.log(`🔧 Backend: http://localhost:${PORT}`);
  console.log(`✅ Backend básico funcionando!`);
  console.log(`📡 Teste: http://localhost:${PORT}/api/whatsapp/status`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});