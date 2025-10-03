// Script para testar se a correção do serviço funcionou
console.log('🔍 TESTANDO CORREÇÃO DO SERVIÇO');
console.log('===============================');

async function testServiceFix() {
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
    
    // 2. Simular o que o sistema faz
    console.log('\n📋 2. SIMULANDO CARREGAMENTO DE CREDENCIAIS...');
    
    // Simular o que o GoogleCalendarServiceHybrid faz
    try {
      // Verificar se o supabaseGoogleCredentialsService está disponível
      if (typeof window !== 'undefined' && window.supabaseGoogleCredentialsService) {
        console.log('✅ supabaseGoogleCredentialsService disponível');
        
        const credentials = await window.supabaseGoogleCredentialsService.getCurrentUserGoogleCredentials();
        if (credentials) {
          console.log('✅ Credenciais carregadas via sistema:');
          console.log('  - Client ID:', credentials.client_id ? 'Configurado (criptografado)' : 'Ausente');
          console.log('  - Client Secret:', credentials.client_secret ? 'Configurado (criptografado)' : 'Ausente');
          console.log('  - Redirect URI:', credentials.redirect_uri);
          console.log('  - Configured:', credentials.configured);
          console.log('  - Cliente ID:', credentials.cliente_id);
          
          // Verificar se é o cliente correto
          if (credentials.cliente_id === currentUser.cliente_id) {
            console.log('✅ Credenciais do cliente correto encontradas!');
            
            // Verificar redirect URI
            const expectedRedirectUri = 'http://localhost:8080/auth/google/callback';
            if (credentials.redirect_uri === expectedRedirectUri) {
              console.log('✅ Redirect URI correto!');
              console.log('🎯 Pronto para testar conexão Google Calendar!');
            } else {
              console.log('❌ Redirect URI incorreto!');
              console.log(`  - Esperado: ${expectedRedirectUri}`);
              console.log(`  - Atual: ${credentials.redirect_uri}`);
            }
          } else {
            console.log('❌ Credenciais do cliente incorreto!');
            console.log(`  - Esperado: ${currentUser.cliente_id}`);
            console.log(`  - Encontrado: ${credentials.cliente_id}`);
          }
        } else {
          console.log('❌ Nenhuma credencial encontrada via sistema');
        }
      } else {
        console.log('❌ supabaseGoogleCredentialsService não disponível');
      }
    } catch (error) {
      console.log('❌ Erro ao carregar credenciais via sistema:', error.message);
    }
    
    // 3. Testar acesso direto
    console.log('\n📋 3. TESTANDO ACESSO DIRETO...');
    
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY_OLD';
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/google_credentials?cliente_id=eq.${currentUser.cliente_id}&select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Status da resposta:', response.status);
      
      if (response.ok) {
        const credentials = await response.json();
        console.log('✅ Acesso direto funcionando!');
        console.log('📊 Credenciais encontradas:', credentials.length);
        
        if (credentials.length > 0) {
          const cred = credentials[0];
          console.log('🔑 Credencial encontrada:');
          console.log('  - Cliente ID:', cred.cliente_id);
          console.log('  - Redirect URI:', cred.redirect_uri);
          console.log('  - Configured:', cred.configured);
        }
      } else {
        console.log('❌ Erro no acesso direto:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ Erro no acesso direto:', error.message);
    }
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testServiceFix();






