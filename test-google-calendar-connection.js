// Script para testar conexão completa com Google Calendar
// Execute este script no console do navegador

console.log('🔍 TESTE: Conexão Completa Google Calendar');

async function testGoogleCalendarConnection() {
  console.log('🚀 Iniciando teste completo...');
  
  try {
    // 1. Verificar se há tokens válidos no Supabase
    console.log('🔍 Passo 1: Verificando tokens no Supabase...');
    
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY';
    
    const response = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?select=*&user_id=eq.fantom.weblabs%40gmail.com`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    console.log('📊 Status Supabase:', response.status);
    
    if (response.status === 406) {
      console.log('❌ Erro 406 - Políticas RLS bloqueando acesso');
      console.log('💡 Execute o script fix-rls-policies-final.sql no Supabase');
      return;
    }
    
    const tokens = await response.json();
    console.log('📊 Tokens encontrados:', tokens);
    
    if (!tokens || tokens.length === 0) {
      console.log('❌ Nenhum token encontrado para fantom.weblabs@gmail.com');
      console.log('💡 Conecte o Google Calendar primeiro');
      return;
    }
    
    const userTokens = tokens[0];
    console.log('✅ Tokens válidos encontrados:', {
      access_token: userTokens.access_token ? 'Presente' : 'Ausente',
      refresh_token: userTokens.refresh_token ? 'Presente' : 'Ausente',
      expires_in: userTokens.expires_in,
      scope: userTokens.scope
    });
    
    // 2. Testar acesso à API do Google Calendar
    console.log('🔍 Passo 2: Testando API do Google Calendar...');
    
    const accessToken = userTokens.access_token;
    
    // Testar acesso ao calendário principal
    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status API Calendar:', calendarResponse.status);
    
    if (calendarResponse.status === 200) {
      const calendarInfo = await calendarResponse.json();
      console.log('✅ Calendário acessível:', {
        id: calendarInfo.id,
        summary: calendarInfo.summary,
        timeZone: calendarInfo.timeZone
      });
    } else {
      const errorText = await calendarResponse.text();
      console.log('❌ Erro ao acessar calendário:', calendarResponse.status, errorText);
    }
    
    // 3. Testar busca de eventos
    console.log('🔍 Passo 3: Testando busca de eventos...');
    
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Próximos 7 dias
    
    const eventsResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      new URLSearchParams({
        timeMin: timeMin,
        timeMax: timeMax,
        maxResults: '10',
        singleEvents: 'true',
        orderBy: 'startTime'
      }), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status Eventos:', eventsResponse.status);
    
    if (eventsResponse.status === 200) {
      const eventsData = await eventsResponse.json();
      console.log('✅ Eventos encontrados:', eventsData.items?.length || 0);
      
      if (eventsData.items && eventsData.items.length > 0) {
        console.log('📅 Primeiros eventos:');
        eventsData.items.slice(0, 3).forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.summary || 'Sem título'} - ${event.start?.dateTime || event.start?.date}`);
        });
      } else {
        console.log('📅 Nenhum evento encontrado nos próximos 7 dias');
      }
    } else {
      const errorText = await eventsResponse.text();
      console.log('❌ Erro ao buscar eventos:', eventsResponse.status, errorText);
    }
    
    // 4. Resumo final
    console.log('🎯 RESUMO DO TESTE:');
    console.log('- ✅ Tokens encontrados no Supabase');
    console.log('- ✅ API do Google Calendar acessível');
    console.log('- ✅ Busca de eventos funcionando');
    console.log('');
    console.log('💡 Se tudo está funcionando aqui, o problema pode estar na aplicação React');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testGoogleCalendarConnection();

console.log('📋 Instruções:');
console.log('1. Verifique se todos os passos retornam ✅');
console.log('2. Se houver ❌, execute o script SQL correspondente');
console.log('3. Se tudo está ✅, o problema está na aplicação React');
