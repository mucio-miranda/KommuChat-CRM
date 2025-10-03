/**
 * Script para limpar completamente o cache do navegador
 * Execute este script no console do navegador
 */

console.log('🧹 Limpando cache completo do navegador...');

// 1. Limpar localStorage
localStorage.clear();
console.log('✅ localStorage limpo');

// 2. Limpar sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage limpo');

// 3. Limpar cookies (se possível)
document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
console.log('✅ Cookies limpos');

// 4. Limpar cache do service worker (se existir)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister();
        }
    });
    console.log('✅ Service workers removidos');
}

// 5. Forçar reload com cache limpo
console.log('🔄 Recarregando página com cache limpo...');
setTimeout(() => {
    window.location.reload(true);
}, 1000);

console.log('🎉 Cache limpo! A página será recarregada automaticamente.');
