// Script para testar acesso a todas as tabelas
console.log('🔍 TESTANDO ACESSO A TODAS AS TABELAS');
console.log('=====================================');

async function testAllAccess() {
  try {
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY_OLD';
    
    const tables = [
      'usuarios',
      'google_credentials', 
      'google_calendar_tokens',
      'clientes',
      'configuracoes_cliente'
    ];
    
    console.log('\n📋 TESTANDO ACESSO A CADA TABELA...\n');
    
    for (const table of tables) {
      try {
        console.log(`🔍 Testando tabela: ${table}`);
        
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ Sucesso! Registros encontrados: ${data.length}`);
          
          if (data.length > 0) {
            console.log(`   📊 Primeiro registro:`, Object.keys(data[0]));
          }
        } else {
          console.log(`   ❌ Erro: ${response.status} ${response.statusText}`);
        }
        
        console.log(''); // Linha em branco
        
      } catch (error) {
        console.log(`   ❌ Exceção: ${error.message}\n`);
      }
    }
    
    // Teste específico para credenciais Google
    console.log('📋 TESTE ESPECÍFICO - CREDENCIAIS GOOGLE...\n');
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/google_credentials?select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const credentials = await response.json();
        console.log(`✅ Credenciais encontradas: ${credentials.length}`);
        
        if (credentials.length > 0) {
          console.log('\n🔑 Credenciais disponíveis:');
          credentials.forEach((cred, index) => {
            console.log(`  ${index + 1}. Cliente ID: ${cred.cliente_id}`);
            console.log(`     - Redirect URI: ${cred.redirect_uri}`);
            console.log(`     - Configured: ${cred.configured}`);
            console.log(`     - Created: ${cred.created_at}`);
          });
          
          // Verificar usuário atual
          const savedUser = localStorage.getItem('kommuchat_user');
          if (savedUser) {
            const currentUser = JSON.parse(savedUser);
            console.log(`\n👤 Usuário atual: ${currentUser.email}`);
            console.log(`   Cliente ID: ${currentUser.cliente_id}`);
            
            // Buscar credencial do usuário atual
            const userCredential = credentials.find(c => c.cliente_id === currentUser.cliente_id);
            if (userCredential) {
              console.log(`\n✅ Credencial do usuário encontrada!`);
              console.log(`   - Redirect URI: ${userCredential.redirect_uri}`);
              console.log(`   - Configured: ${userCredential.configured}`);
              
              // Verificar redirect URI
              const expectedRedirectUri = 'http://localhost:8080/auth/google/callback';
              if (userCredential.redirect_uri === expectedRedirectUri) {
                console.log(`✅ Redirect URI correto!`);
                console.log(`🎯 Pronto para testar conexão Google Calendar!`);
              } else {
                console.log(`❌ Redirect URI incorreto!`);
                console.log(`   - Esperado: ${expectedRedirectUri}`);
                console.log(`   - Atual: ${userCredential.redirect_uri}`);
              }
            } else {
              console.log(`❌ Nenhuma credencial encontrada para o usuário atual`);
            }
          }
        }
      } else {
        console.log(`❌ Erro ao buscar credenciais: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Erro no teste específico: ${error.message}`);
    }
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testAllAccess();






