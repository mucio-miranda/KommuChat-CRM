/**
 * Script para limpar tokens de teste do Google Calendar
 * Execute este script no console do navegador para limpar dados de teste
 */

console.log('🧹 Limpando tokens de teste do Google Calendar...');

// 1. Limpar localStorage
localStorage.removeItem('google_calendar_tokens');
localStorage.removeItem('google_code_verifier');
console.log('✅ localStorage limpo');

// 2. Limpar dados do usuário atual
const currentUser = localStorage.getItem('kommuchat_user');
if (currentUser) {
  try {
    const user = JSON.parse(currentUser);
    console.log('👤 Usuário atual:', user.email);
    
    // Limpar tokens do Supabase (se possível)
    if (window.supabaseGoogleTokensService) {
      window.supabaseGoogleTokensService.deleteTokens(user.email)
        .then(() => {
          console.log('✅ Tokens removidos do Supabase');
        })
        .catch((error) => {
          console.log('⚠️ Erro ao remover tokens do Supabase:', error);
        });
    }
  } catch (error) {
    console.log('⚠️ Erro ao parsear usuário:', error);
  }
}

// 3. Limpar cache do serviço Google Calendar
if (window.googleCalendarService) {
  window.googleCalendarService.clearAccessToken();
  window.googleCalendarService.clearCredentialsCache();
  console.log('✅ Cache do Google Calendar limpo');
}

// 4. Recarregar a página para aplicar as mudanças
console.log('🔄 Recarregando página em 2 segundos...');
setTimeout(() => {
  window.location.reload();
}, 2000);

console.log('🎉 Limpeza concluída! A página será recarregada automaticamente.');
