// Script para testar as funções de bypass
console.log('🔍 TESTANDO FUNÇÕES DE BYPASS');
console.log('==============================');

async function testBypassFunctions() {
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
    
    // 2. Testar função que retorna credenciais específicas
    console.log('\n📋 2. TESTANDO FUNÇÃO ESPECÍFICA...');
    
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY_OLD';
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_google_credentials_by_cliente_id`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_cliente_id: currentUser.cliente_id
        })
      });
      
      console.log('📡 Status da resposta:', response.status);
      
      if (response.ok) {
        const credentials = await response.json();
        console.log('✅ Função específica funcionando!');
        console.log('📊 Credenciais encontradas:', credentials.length);
        
        if (credentials.length > 0) {
          const cred = credentials[0];
          console.log('🔑 Credencial encontrada:');
          console.log('  - Cliente ID:', cred.cliente_id);
          console.log('  - Redirect URI:', cred.redirect_uri);
          console.log('  - Configured:', cred.configured);
          
          // Verificar redirect URI
          const expectedRedirectUri = 'http://localhost:8080/auth/google/callback';
          if (cred.redirect_uri === expectedRedirectUri) {
            console.log('✅ Redirect URI correto!');
            console.log('🎯 Pronto para testar conexão Google Calendar!');
          } else {
            console.log('❌ Redirect URI incorreto!');
            console.log(`  - Esperado: ${expectedRedirectUri}`);
            console.log(`  - Atual: ${cred.redirect_uri}`);
          }
        }
      } else {
        console.log('❌ Erro na função específica:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ Erro na função específica:', error.message);
    }
    
    // 3. Testar função que retorna todas as credenciais
    console.log('\n📋 3. TESTANDO FUNÇÃO GERAL...');
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_all_google_credentials`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Status da resposta:', response.status);
      
      if (response.ok) {
        const credentials = await response.json();
        console.log('✅ Função geral funcionando!');
        console.log('📊 Total de credenciais:', credentials.length);
        
        // Mostrar todas as credenciais
        credentials.forEach((cred, index) => {
          console.log(`  ${index + 1}. Cliente ID: ${cred.cliente_id}`);
          console.log(`     - Redirect URI: ${cred.redirect_uri}`);
          console.log(`     - Configured: ${cred.configured}`);
        });
      } else {
        console.log('❌ Erro na função geral:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ Erro na função geral:', error.message);
    }
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testBypassFunctions();






