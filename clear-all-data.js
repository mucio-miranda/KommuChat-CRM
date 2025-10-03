/**
 * Script para limpar todos os dados e forçar login real
 * Execute este script no console do navegador
 */

console.log('🧹 Limpando todos os dados...');

// Limpar localStorage completamente
localStorage.clear();

// Limpar sessionStorage
sessionStorage.clear();

// Limpar cookies (se houver)
document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

console.log('✅ Todos os dados removidos');
console.log('🔄 Recarregue a página para forçar login real');

// Recarregar página após 2 segundos
setTimeout(() => {
    window.location.reload();
}, 2000);
image.png