// Script para debugar o login do usuário
console.log('🔍 DEBUG - Verificando usuário logado...');

// Verificar localStorage
const savedUser = localStorage.getItem('kommuchat_user');
console.log('📱 localStorage - kommuchat_user:', savedUser);

if (savedUser) {
  try {
    const userData = JSON.parse(savedUser);
    console.log('✅ Usuário parseado:', userData);
    console.log('🔑 Role do usuário:', userData.role);
    console.log('👤 Nome do usuário:', userData.nome);
    console.log('📧 Email do usuário:', userData.email);
    console.log('🏢 Cliente ID:', userData.cliente_id);
    
    // Verificar se é admin_clinica
    if (userData.role === 'admin_clinica') {
      console.log('✅ Usuário é admin_clinica - deve ter acesso aos funcionários');
    } else {
      console.log('❌ Usuário NÃO é admin_clinica - role atual:', userData.role);
    }
  } catch (error) {
    console.error('❌ Erro ao fazer parse do usuário:', error);
  }
} else {
  console.log('❌ Nenhum usuário encontrado no localStorage');
}

// Verificar se estamos na página correta
console.log('🌐 URL atual:', window.location.href);
console.log('📍 Pathname:', window.location.pathname);






