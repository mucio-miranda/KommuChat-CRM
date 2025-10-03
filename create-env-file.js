/**
 * Script para criar o arquivo .env com as configurações corretas
 * Execute este script no console do navegador para ver o conteúdo do .env
 */

console.log('🔧 Conteúdo do arquivo .env que você deve criar:');
console.log('');
console.log('📝 Copie o conteúdo abaixo e cole em um arquivo chamado ".env" na raiz do projeto:');
console.log('');
console.log('='.repeat(80));
console.log(`
# Supabase CRM (para gerenciamento de usuários e credenciais Google)
VITE_CRM_SUPABASE_URL=https://wywzdtyjzzmcehrsalvn.supabase.co
VITE_CRM_SUPABASE_ANON_KEY=REMOVED_SUPABASE_CRM_ANON_KEY

# Supabase Principal (para dados dos clientes - pacientes, etc.)
VITE_SUPABASE_URL=https://fxrsizluqodjotcorxop.supabase.co
VITE_SUPABASE_ANON_KEY=REMOVED_SUPABASE_ANON_KEY

# Google Calendar API (padrão - será sobrescrito pelas credenciais do cliente)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback

# Configuração de Criptografia para Credenciais
VITE_ENCRYPTION_KEY=kommuchat-encryption-key-2024

# WhatsApp API (opcional)
VITE_WHATSAPP_API_URL=http://localhost:3001

# Configuração Admin
VITE_ADMIN_EMAIL=admin@kommuchat.com
VITE_ADMIN_PASSWORD=admin123

# App Configuration
VITE_APP_NAME=KOMMUchat CRM
VITE_APP_VERSION=1.0.0
`);
console.log('='.repeat(80));
console.log('');
console.log('📋 INSTRUÇÕES:');
console.log('1. Crie um arquivo chamado ".env" na raiz do projeto (mesmo nível do package.json)');
console.log('2. Cole o conteúdo acima no arquivo');
console.log('3. Salve o arquivo');
console.log('4. Reinicie o servidor de desenvolvimento (Ctrl+C e depois npm run dev)');
console.log('');
console.log('✅ Após isso, o sistema deve funcionar corretamente!');
