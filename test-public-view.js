// Script para testar a view pública das credenciais
console.log('🔍 TESTANDO VIEW PÚBLICA DAS CREDENCIAIS');
console.log('========================================');

async function testPublicView() {
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
    
    // 2. Testar acesso via view pública
    console.log('\n📋 2. TESTANDO VIEW PÚBLICA...');
    
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY_OLD';
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/public_google_credentials?select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Status da resposta:', response.status);
      
      if (response.ok) {
        const credentials = await response.json();
        console.log('✅ View pública funcionando!');
        console.log('📊 Credenciais encontradas:', credentials.length);
        
        if (credentials.length > 0) {
          console.log('\n🔑 Credenciais disponíveis:');
          credentials.forEach((cred, index) => {
            console.log(`  ${index + 1}. Cliente ID: ${cred.cliente_id}`);
            console.log(`     - Redirect URI: ${cred.redirect_uri}`);
            console.log(`     - Configured: ${cred.configured}`);
            console.log(`     - Created: ${cred.created_at}`);
          });
          
          // Buscar credencial do usuário atual
          const userCredential = credentials.find(c => c.cliente_id === currentUser.cliente_id);
          if (userCredential) {
            console.log('\n✅ Credencial do usuário encontrada!');
            console.log('  - Cliente ID:', userCredential.cliente_id);
            console.log('  - Client ID:', userCredential.client_id ? 'Configurado (criptografado)' : 'Ausente');
            console.log('  - Client Secret:', userCredential.client_secret ? 'Configurado (criptografado)' : 'Ausente');
            console.log('  - Redirect URI:', userCredential.redirect_uri);
            console.log('  - Configured:', userCredential.configured);
            
            // Verificar redirect URI
            const expectedRedirectUri = 'http://localhost:8080/auth/google/callback';
            if (userCredential.redirect_uri === expectedRedirectUri) {
              console.log('✅ Redirect URI correto!');
              console.log('🎯 Pronto para testar conexão Google Calendar!');
            } else {
              console.log('❌ Redirect URI incorreto!');
              console.log(`  - Esperado: ${expectedRedirectUri}`);
              console.log(`  - Atual: ${userCredential.redirect_uri}`);
            }
          } else {
            console.log('❌ Nenhuma credencial encontrada para o usuário atual');
          }
        }
      } else {
        console.log('❌ Erro na view pública:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ Erro na view pública:', error.message);
    }
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testPublicView();






