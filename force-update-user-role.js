// Script para forçar a atualização do role do usuário no localStorage
console.log('🔧 Forçando atualização do role do usuário...');

// Buscar usuário atual
const savedUser = localStorage.getItem('kommuchat_user');
if (savedUser) {
  try {
    const userData = JSON.parse(savedUser);
    console.log('👤 Usuário atual:', userData);
    
    // Atualizar o role para admin_clinica
    userData.role = 'admin_clinica';
    
    // Salvar de volta no localStorage
    localStorage.setItem('kommuchat_user', JSON.stringify(userData));
    
    console.log('✅ Role atualizado para admin_clinica');
    console.log('🔄 Recarregue a página para aplicar as mudanças');
    
    // Recarregar a página automaticamente
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Erro ao atualizar role:', error);
  }
} else {
  console.log('❌ Nenhum usuário encontrado no localStorage');
}


