// Script para testar busca de eventos do Google Calendar
// Execute este script no console do navegador

console.log('🔍 TESTE: Busca de Eventos Google Calendar');

async function testGoogleEvents() {
  console.log('🚀 Iniciando teste de eventos...');
  
  // 1. Verificar se há tokens válidos
  console.log('🔍 Verificando tokens...');
  try {
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY';
    
    const response = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?select=*&user_id=eq.fantom.weblabs%40gmail.com`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    const tokens = await response.json();
    console.log('📊 Tokens encontrados:', tokens);
    
    if (tokens && tokens.length > 0) {
      console.log('✅ Tokens válidos encontrados');
      
      // 2. Testar busca de eventos diretamente na API do Google
      console.log('🔍 Testando busca de eventos na API do Google...');
      
      const accessToken = tokens[0].access_token;
      const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Status da API Google:', calendarResponse.status);
      
      if (calendarResponse.status === 200) {
        const events = await calendarResponse.json();
        console.log('📅 Eventos encontrados:', events.items?.length || 0);
        console.log('📋 Primeiros eventos:', events.items?.slice(0, 3));
        console.log('✅ API do Google funcionando!');
      } else {
        const errorText = await calendarResponse.text();
        console.log('❌ Erro na API do Google:', calendarResponse.status, errorText);
      }
      
    } else {
      console.log('❌ Nenhum token encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testGoogleEvents();

console.log('📋 Instruções:');
console.log('1. Verifique se os tokens estão sendo encontrados');
console.log('2. Confirme se a API do Google está respondendo');
console.log('3. Se houver erro 401, o token pode ter expirado');
console.log('4. Se houver erro 403, verifique as permissões no Google Cloud Console');
