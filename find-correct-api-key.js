// Script para encontrar a chave API correta do Supabase CRM
console.log('🔍 PROCURANDO CHAVE API CORRETA DO SUPABASE CRM');
console.log('===============================================');

async function findCorrectApiKey() {
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
    
    // 2. Lista de possíveis chaves API
    console.log('\n📋 2. TESTANDO POSSÍVEIS CHAVES API...');
    
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    const possibleKeys = [
      // Chave atual (que está falhando)
      'REMOVED_SUPABASE_CRM_ANON_KEY_OLD',
      
      // Outras possíveis chaves (você precisa substituir por chaves reais)
      'REMOVED_SUPABASE_CRM_ANON_KEY_OLD2',
      'REMOVED_SUPABASE_CRM_ANON_KEY_OLD3'
    ];
    
    for (let i = 0; i < possibleKeys.length; i++) {
      const key = possibleKeys[i];
      console.log(`\n🔑 Testando chave ${i + 1}...`);
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/google_credentials?select=count`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          console.log(`   ✅ CHAVE ${i + 1} FUNCIONA!`);
          console.log(`   🔑 Chave válida: ${key}`);
          
          // Testar acesso completo
          const fullResponse = await fetch(`${supabaseUrl}/rest/v1/google_credentials?select=*&limit=1`, {
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (fullResponse.ok) {
            const data = await fullResponse.json();
            console.log(`   📊 Dados acessíveis: ${data.length} registros`);
            console.log(`   🎯 Use esta chave nos scripts!`);
            break;
          }
        } else {
          console.log(`   ❌ Chave ${i + 1} inválida`);
        }
      } catch (error) {
        console.log(`   ❌ Erro com chave ${i + 1}: ${error.message}`);
      }
    }
    
    // 3. Instruções para obter a chave correta
    console.log('\n📋 3. COMO OBTER A CHAVE CORRETA...');
    console.log('⚠️  Para obter a chave API correta:');
    console.log('  1. Acesse: https://supabase.com/dashboard/project/wywzdtyjzzmcehrsalvn');
    console.log('  2. Vá para: Settings > API');
    console.log('  3. Copie a chave "anon public"');
    console.log('  4. Substitua no arquivo .env');
    console.log('  5. Reinicie a aplicação');
    
    // 4. Verificar arquivo .env
    console.log('\n📋 4. VERIFICANDO ARQUIVO .ENV...');
    console.log('🔍 Verifique se o arquivo .env contém:');
    console.log('  VITE_CRM_SUPABASE_URL=https://wywzdtyjzzmcehrsalvn.supabase.co');
    console.log('  VITE_CRM_SUPABASE_ANON_KEY=sua_chave_correta_aqui');
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
findCorrectApiKey();






