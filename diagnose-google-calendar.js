// Script para diagnosticar problemas na conexão Google Calendar
// Execute este script no console do navegador

console.log('🔍 DIAGNÓSTICO: Problemas na Conexão Google Calendar');

async function diagnoseGoogleCalendar() {
  console.log('🚀 Iniciando diagnóstico completo...');
  
  try {
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY';
    
    // 1. Verificar usuário atual
    console.log('🔍 Passo 1: Verificando usuário atual...');
    const savedUser = localStorage.getItem('kommuchat_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      console.log('✅ Usuário encontrado:', {
        email: user.email,
        cliente_id: user.cliente_id,
        role: user.role
      });
    } else {
      console.log('❌ Nenhum usuário encontrado no localStorage');
    }
    
    // 2. Verificar tabela google_credentials
    console.log('🔍 Passo 2: Verificando google_credentials...');
    const credentialsResponse = await fetch(`${supabaseUrl}/rest/v1/google_credentials?select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    console.log('📊 Status google_credentials:', credentialsResponse.status);
    
    if (credentialsResponse.status === 200) {
      const credentials = await credentialsResponse.json();
      console.log('📊 Credenciais encontradas:', credentials.length);
      
      if (credentials.length === 0) {
        console.log('❌ PROBLEMA: Nenhuma credencial Google configurada!');
        console.log('💡 Solução: Crie um usuário e configure as credenciais Google');
      } else {
        credentials.forEach((cred, index) => {
          console.log(`  ${index + 1}. Cliente: ${cred.cliente_id}`);
          console.log(`     - Client ID: ${cred.client_id ? 'Configurado' : 'Não configurado'}`);
          console.log(`     - Client Secret: ${cred.client_secret ? 'Configurado' : 'Não configurado'}`);
          console.log(`     - Redirect URI: ${cred.redirect_uri || 'Não configurado'}`);
          console.log(`     - Calendar ID: ${cred.calendar_id || 'Não configurado'}`);
          console.log(`     - Configurado: ${cred.configured ? 'Sim' : 'Não'}`);
        });
      }
    } else {
      const errorText = await credentialsResponse.text();
      console.log('❌ Erro ao buscar credenciais:', credentialsResponse.status, errorText);
    }
    
    // 3. Verificar tabela google_calendar_tokens
    console.log('🔍 Passo 3: Verificando google_calendar_tokens...');
    const tokensResponse = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    console.log('📊 Status google_calendar_tokens:', tokensResponse.status);
    
    if (tokensResponse.status === 200) {
      const tokens = await tokensResponse.json();
      console.log('📊 Tokens encontrados:', tokens.length);
      
      if (tokens.length === 0) {
        console.log('❌ PROBLEMA: Nenhum token Google encontrado!');
        console.log('💡 Solução: Conecte o Google Calendar primeiro');
      } else {
        tokens.forEach((token, index) => {
          console.log(`  ${index + 1}. Usuário: ${token.user_id}`);
          console.log(`     - Access Token: ${token.access_token ? 'Presente' : 'Ausente'}`);
          console.log(`     - Refresh Token: ${token.refresh_token ? 'Presente' : 'Ausente'}`);
          console.log(`     - Expires In: ${token.expires_in || 'Não definido'}`);
          console.log(`     - Scope: ${token.scope || 'Não definido'}`);
        });
      }
    } else if (tokensResponse.status === 406) {
      console.log('❌ PROBLEMA: Erro 406 - Políticas RLS bloqueando acesso!');
      console.log('💡 Solução: Execute o script simple-rls-fix.sql no Supabase');
    } else {
      const errorText = await tokensResponse.text();
      console.log('❌ Erro ao buscar tokens:', tokensResponse.status, errorText);
    }
    
    // 4. Verificar variáveis de ambiente
    console.log('🔍 Passo 4: Verificando variáveis de ambiente...');
    const envVars = {
      'VITE_GOOGLE_CLIENT_ID': import.meta.env.VITE_GOOGLE_CLIENT_ID,
      'VITE_GOOGLE_CLIENT_SECRET': import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
      'VITE_GOOGLE_REDIRECT_URI': import.meta.env.VITE_GOOGLE_REDIRECT_URI
    };
    
    console.log('📊 Variáveis de ambiente:');
    let hasEnvFallback = false;
    Object.entries(envVars).forEach(([key, value]) => {
      if (value && value !== 'your_google_client_id' && value !== 'your_google_client_secret') {
        console.log(`  ✅ ${key}: Configurado`);
        hasEnvFallback = true;
      } else {
        console.log(`  ❌ ${key}: Não configurado ou placeholder`);
      }
    });
    
    // 5. Diagnóstico final
    console.log('🎯 DIAGNÓSTICO FINAL:');
    
    if (tokensResponse.status === 406) {
      console.log('❌ PROBLEMA PRINCIPAL: Políticas RLS bloqueando acesso');
      console.log('💡 SOLUÇÃO: Execute o script simple-rls-fix.sql no Supabase CRM');
    } else if (credentials.length === 0) {
      console.log('❌ PROBLEMA PRINCIPAL: Nenhuma credencial Google configurada');
      console.log('💡 SOLUÇÃO: Crie um usuário e configure as credenciais Google');
    } else if (tokens.length === 0) {
      console.log('❌ PROBLEMA PRINCIPAL: Nenhum token Google encontrado');
      console.log('💡 SOLUÇÃO: Conecte o Google Calendar primeiro');
    } else {
      console.log('✅ Sistema configurado corretamente');
      console.log('💡 Se ainda não funciona, verifique os logs da aplicação');
    }
    
  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnoseGoogleCalendar();
