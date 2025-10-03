// Verificar usuários cadastrados
console.log('👤 Verificando usuários cadastrados...\n');

const env = {
  VITE_CRM_SUPABASE_URL: 'https://wywzdtyjzzmcehrsalvn.supabase.co',
  VITE_CRM_SUPABASE_ANON_KEY: 'REMOVED_SUPABASE_CRM_ANON_KEY'
};

async function checkUsers() {
  try {
    const response = await fetch(`${env.VITE_CRM_SUPABASE_URL}/rest/v1/usuarios?select=*`, {
      method: 'GET',
      headers: {
        'apikey': env.VITE_CRM_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.VITE_CRM_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`📋 Encontrados ${data.length} usuários:`);
      
      data.forEach((user, i) => {
        console.log(`${i+1}. ${user.email}`);
        console.log(`   - Nome: ${user.nome}`);
        console.log(`   - Cliente ID: ${user.cliente_id}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Ativo: ${user.ativo ? 'Sim' : 'Não'}`);
        console.log('');
      });
    } else {
      console.log(`❌ Erro ao buscar usuários: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
}

checkUsers();





