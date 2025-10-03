// Script para verificar a estrutura do usuário logado
console.log('🔍 VERIFICANDO ESTRUTURA DO USUÁRIO LOGADO');
console.log('==========================================');

function debugUserStructure() {
  try {
    // 1. Verificar usuário no localStorage
    console.log('\n📋 1. VERIFICANDO USUÁRIO NO LOCALSTORAGE...');
    
    const savedUser = localStorage.getItem('kommuchat_user');
    if (!savedUser) {
      console.log('❌ Nenhum usuário encontrado no localStorage');
      return;
    }
    
    const currentUser = JSON.parse(savedUser);
    console.log('✅ Usuário encontrado:');
    console.log('  - Email:', currentUser.email);
    console.log('  - Nome:', currentUser.nome);
    console.log('  - ID:', currentUser.id);
    console.log('  - Role:', currentUser.role);
    console.log('  - Cliente ID:', currentUser.cliente_id);
    
    // 2. Verificar se tem cliente_id
    if (!currentUser.cliente_id) {
      console.log('❌ PROBLEMA: Usuário não tem cliente_id!');
      console.log('🔧 SOLUÇÃO: Adicionar cliente_id ao usuário');
      
      // 3. Verificar credenciais disponíveis
      console.log('\n📋 3. VERIFICANDO CREDENCIAIS DISPONÍVEIS...');
      
      // Buscar credenciais no Supabase
      fetch('https://wywzdtyjzzmcehrsalvn.supabase.co/rest/v1/google_credentials?select=*', {
        headers: {
          'apikey': 'REMOVED_SUPABASE_CRM_ANON_KEY_OLD',
          'Authorization': 'Bearer REMOVED_SUPABASE_CRM_ANON_KEY_OLD',
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(credentials => {
        console.log('📊 Credenciais disponíveis:', credentials.length);
        
        if (credentials.length > 0) {
          console.log('\n🔑 Credenciais encontradas:');
          credentials.forEach((cred, index) => {
            console.log(`  ${index + 1}. Cliente ID: ${cred.cliente_id}`);
            console.log(`     - Redirect URI: ${cred.redirect_uri}`);
            console.log(`     - Configured: ${cred.configured}`);
            console.log(`     - Created: ${cred.created_at}`);
          });
          
          // Sugerir usar a primeira credencial
          const firstCredential = credentials[0];
          console.log('\n💡 SUGESTÃO:');
          console.log(`Use o cliente_id: ${firstCredential.cliente_id}`);
          console.log('Para corrigir, execute:');
          console.log(`
// Adicionar cliente_id ao usuário
const user = JSON.parse(localStorage.getItem('kommuchat_user'));
user.cliente_id = '${firstCredential.cliente_id}';
localStorage.setItem('kommuchat_user', JSON.stringify(user));
console.log('✅ Cliente ID adicionado ao usuário');
          `);
        }
      })
      .catch(error => {
        console.log('❌ Erro ao buscar credenciais:', error);
      });
      
    } else {
      console.log('✅ Usuário tem cliente_id:', currentUser.cliente_id);
    }
    
    // 4. Verificar estrutura completa do usuário
    console.log('\n📋 4. ESTRUTURA COMPLETA DO USUÁRIO:');
    console.log(JSON.stringify(currentUser, null, 2));
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

// Executar verificação
debugUserStructure();






