/**
 * Script para limpar dados de visitante e forçar login real
 * Execute este script no console do navegador
 */

console.log('🧹 Limpando dados de visitante...');

// Limpar localStorage
localStorage.removeItem('kommuchat_user');
localStorage.removeItem('kommuchat_isVisitor');
localStorage.removeItem('google_calendar_tokens');

// Limpar sessionStorage
sessionStorage.clear();

console.log('✅ Dados de visitante removidos');
console.log('🔄 Recarregue a página para forçar login real');

// Recarregar página após 2 segundos
setTimeout(() => {
    window.location.reload();
}, 2000);
