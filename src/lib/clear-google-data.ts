// Script para limpar dados do Google Calendar
// Use este script para resetar a conexão e testar novamente

import { supabaseGoogleTokensService } from './supabase-google-tokens';

export async function clearGoogleCalendarData() {
  console.log('🧹 Limpando dados do Google Calendar...');
  
  // Limpar tokens do Supabase (única fonte de verdade)
  try {
    await supabaseGoogleTokensService.deleteTokens();
    console.log('✅ Tokens deletados do Supabase');
  } catch (error) {
    console.error('❌ Erro ao deletar tokens do Supabase:', error);
  }
  
  // Limpar localStorage (apenas cache/estado)
  localStorage.removeItem('google_calendar_connected');
  localStorage.removeItem('google_code_verifier');
  
  // Limpar sessionStorage
  sessionStorage.removeItem('google_code_verifier');
  
  console.log('✅ Dados limpos com sucesso!');
  console.log('🔄 Recarregue a página para testar novamente');
}

// Função para verificar dados atuais
export async function checkGoogleCalendarData() {
  console.log('🔍 Verificando dados atuais do Google Calendar...');
  
  // Verificar tokens no Supabase
  try {
    const tokens = await supabaseGoogleTokensService.getTokens();
    if (tokens) {
      console.log('🔑 Tokens no Supabase:', {
        has_access_token: !!tokens.access_token,
        has_refresh_token: !!tokens.refresh_token,
        expires_at: tokens.expires_at,
        user_id: tokens.user_id
      });
    } else {
      console.log('📦 Nenhum token encontrado no Supabase');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar tokens no Supabase:', error);
  }
  
  const localVerifier = localStorage.getItem('google_code_verifier');
  const connectionState = localStorage.getItem('google_calendar_connected');
  
  console.log('📦 localStorage connection state:', connectionState);
  console.log('📦 localStorage code_verifier:', localVerifier ? 'Presente' : 'Ausente');
}

// Disponibilizar funções globalmente para debug
if (typeof window !== 'undefined') {
  (window as any).clearGoogleCalendarData = clearGoogleCalendarData;
  (window as any).checkGoogleCalendarData = checkGoogleCalendarData;
}

