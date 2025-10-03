// Script para testar a URL de autorização diretamente
console.log('🔍 TESTANDO URL DE AUTORIZAÇÃO DIRETAMENTE');
console.log('==========================================');

async function testAuthUrl() {
  try {
    // 1. Verificar usuário atual
    console.log('\n📋 1. VERIFICANDO USUÁRIO ATUAL...');
    
    const savedUser = localStorage.getItem('kommuchat_user');
    if (!savedUser) {
      console.log('❌ Nenhum usuário encontrado');
      return;
    }
    
    const currentUser = JSON.parse(savedUser);
    console.log('✅ Usuário:', currentUser.email);
    console.log('✅ Cliente ID:', currentUser.cliente_id);
    
    // 2. Buscar credenciais
    console.log('\n📋 2. BUSCANDO CREDENCIAIS...');
    
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY_OLD';
    
    const response = await fetch(`${supabaseUrl}/rest/v1/google_credentials?cliente_id=eq.${currentUser.cliente_id}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log('❌ Erro ao buscar credenciais:', response.status);
      return;
    }
    
    const credentials = await response.json();
    if (credentials.length === 0) {
      console.log('❌ Nenhuma credencial encontrada');
      return;
    }
    
    const userCredential = credentials[0];
    console.log('✅ Credencial encontrada');
    
    // 3. Verificar se as credenciais estão completas
    if (!userCredential.client_id || !userCredential.client_secret) {
      console.log('❌ Credenciais incompletas!');
      console.log('  - Client ID:', userCredential.client_id ? 'Presente' : 'AUSENTE');
      console.log('  - Client Secret:', userCredential.client_secret ? 'Presente' : 'AUSENTE');
      return;
    }
    
    // 4. Verificar redirect URI
    const expectedRedirectUri = 'http://localhost:8080/auth/google/callback';
    if (userCredential.redirect_uri !== expectedRedirectUri) {
      console.log('❌ Redirect URI incorreto!');
      console.log(`  - Esperado: ${expectedRedirectUri}`);
      console.log(`  - Atual: ${userCredential.redirect_uri}`);
      return;
    }
    
    console.log('✅ Redirect URI correto');
    
    // 5. Gerar URL de autorização
    console.log('\n📋 5. GERANDO URL DE AUTORIZAÇÃO...');
    
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ];
    
    const params = new URLSearchParams({
      client_id: userCredential.client_id,
      redirect_uri: userCredential.redirect_uri,
      scope: scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'select_account consent',
      include_granted_scopes: 'true'
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('✅ URL de autorização gerada:');
    console.log('  - Client ID:', userCredential.client_id);
    console.log('  - Redirect URI:', userCredential.redirect_uri);
    console.log('  - Scopes:', scopes.join(', '));
    
    // 6. Testar a URL
    console.log('\n📋 6. TESTANDO URL...');
    console.log('🔗 URL completa:');
    console.log(authUrl);
    
    // 7. Oferecer para abrir a URL
    console.log('\n📋 7. TESTE MANUAL...');
    console.log('Para testar a URL:');
    console.log('1. Copie a URL acima');
    console.log('2. Cole em uma nova aba do navegador');
    console.log('3. Verifique se redireciona para o Google OAuth');
    console.log('4. Se der erro 400, o problema é no Google Cloud Console');
    
    // 8. Verificar se a URL está bem formada
    console.log('\n📋 8. VERIFICANDO FORMAÇÃO DA URL...');
    
    try {
      const url = new URL(authUrl);
      console.log('✅ URL bem formada:');
      console.log('  - Protocol:', url.protocol);
      console.log('  - Host:', url.host);
      console.log('  - Pathname:', url.pathname);
      console.log('  - Search params:', url.searchParams.toString());
      
      // Verificar parâmetros obrigatórios
      const requiredParams = ['client_id', 'redirect_uri', 'scope', 'response_type'];
      const missingParams = requiredParams.filter(param => !url.searchParams.has(param));
      
      if (missingParams.length > 0) {
        console.log('❌ Parâmetros obrigatórios ausentes:', missingParams);
      } else {
        console.log('✅ Todos os parâmetros obrigatórios presentes');
      }
      
    } catch (error) {
      console.log('❌ URL mal formada:', error.message);
    }
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testAuthUrl();






