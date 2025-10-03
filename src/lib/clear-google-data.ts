// Script para limpar dados antigos do Google Calendar
// Use este script para resetar a conexão e testar novamente

export function clearGoogleCalendarData() {
  console.log('🧹 Limpando dados antigos do Google Calendar...');
  
  // Limpar localStorage
  localStorage.removeItem('google_calendar_tokens');
  localStorage.removeItem('google_code_verifier');
  
  // Limpar sessionStorage
  sessionStorage.removeItem('google_code_verifier');
  
  console.log('✅ Dados limpos com sucesso!');
  console.log('🔄 Recarregue a página para testar novamente');
}

// Função para verificar dados atuais
export function checkGoogleCalendarData() {
  console.log('🔍 Verificando dados atuais do Google Calendar...');
  
  const localTokens = localStorage.getItem('google_calendar_tokens');
  const localVerifier = localStorage.getItem('google_code_verifier');
  const sessionVerifier = sessionStorage.getItem('google_code_verifier');
  
  console.log('📦 localStorage tokens:', localTokens ? 'Presente' : 'Ausente');
  console.log('📦 localStorage code_verifier:', localVerifier ? 'Presente' : 'Ausente');
  console.log('📦 sessionStorage code_verifier:', sessionVerifier ? 'Presente' : 'Ausente');
  
  if (localTokens) {
    try {
      const tokens = JSON.parse(localTokens);
      console.log('🔑 Tokens:', tokens);
    } catch (error) {
      console.error('❌ Erro ao parsear tokens:', error);
    }
  }
}

// Disponibilizar funções globalmente para debug
if (typeof window !== 'undefined') {
  (window as any).clearGoogleCalendarData = clearGoogleCalendarData;
  (window as any).checkGoogleCalendarData = checkGoogleCalendarData;
}

