// Script para testar especificamente a tabela google_calendar_tokens
// Execute este script no console do navegador

console.log('🔍 TESTE: Tabela google_calendar_tokens');

async function testGoogleTokensTable() {
  const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
  const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY';
  
  // 1. Testar busca simples (sem filtros)
  console.log('🔍 Teste 1: Busca simples na tabela...');
  try {
    const response1 = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?select=*&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    console.log('📊 Status:', response1.status);
    const data1 = await response1.json();
    console.log('📊 Dados:', data1);
    
    if (response1.status === 200) {
      console.log('✅ Tabela acessível');
    } else {
      console.log('❌ Problema na tabela:', response1.status);
    }
  } catch (error) {
    console.error('❌ Erro no teste 1:', error);
  }
  
  // 2. Testar busca com filtro de usuário
  console.log('🔍 Teste 2: Busca com filtro de usuário...');
  try {
    const testUserId = 'fantom.weblabs@gmail.com';
    const response2 = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?select=*&user_id=eq.${encodeURIComponent(testUserId)}`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    console.log('📊 Status:', response2.status);
    const data2 = await response2.json();
    console.log('📊 Dados:', data2);
    
    if (response2.status === 200) {
      console.log('✅ Filtro por usuário funcionando');
    } else {
      console.log('❌ Problema no filtro:', response2.status);
    }
  } catch (error) {
    console.error('❌ Erro no teste 2:', error);
  }
  
  // 3. Testar inserção de token de teste
  console.log('🔍 Teste 3: Inserção de token de teste...');
  try {
    const testToken = {
      user_id: 'test@example.com',
      access_token: 'test_access_token',
      refresh_token: 'test_refresh_token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'calendar.readonly calendar.events'
    };
    
    const response3 = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(testToken)
    });
    
    console.log('📊 Status:', response3.status);
    
    if (response3.status === 201) {
      console.log('✅ Inserção funcionando');
    } else if (response3.status === 409) {
      console.log('ℹ️ Token já existe (OK)');
    } else {
      const errorText = await response3.text();
      console.log('❌ Problema na inserção:', response3.status, errorText);
    }
  } catch (error) {
    console.error('❌ Erro no teste 3:', error);
  }
  
  // 4. Testar contagem final
  console.log('🔍 Teste 4: Contagem de registros...');
  try {
    const response4 = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?select=count`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'count=exact'
      }
    });
    
    console.log('📊 Status:', response4.status);
    const count = response4.headers.get('content-range');
    console.log('📊 Contagem:', count);
    
  } catch (error) {
    console.error('❌ Erro no teste 4:', error);
  }
}

// Executar teste
console.log('🚀 Iniciando teste da tabela google_calendar_tokens...');
testGoogleTokensTable();
