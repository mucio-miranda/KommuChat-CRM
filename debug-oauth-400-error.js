// Script para diagnosticar erro 400 do Google OAuth
console.log('🔍 DIAGNÓSTICO DO ERRO 400 - GOOGLE OAUTH');
console.log('==========================================');

async function debugOAuth400() {
  try {
    // 1. Verificar credenciais no Supabase
    console.log('\n📋 1. VERIFICANDO CREDENCIAIS NO SUPABASE...');
    
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY_OLD';
    
    // Buscar usuário atual
    const userResponse = await fetch(`${supabaseUrl}/rest/v1/usuarios?select=*&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!userResponse.ok) {
      console.log('❌ Erro ao buscar usuário:', userResponse.status);
      return;
    }
    
    const users = await userResponse.json();
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado');
      return;
    }
    
    const currentUser = users[0];
    console.log('✅ Usuário atual:', currentUser.email);
    
    // Buscar credenciais Google do usuário
    const credentialsResponse = await fetch(`${supabaseUrl}/rest/v1/google_credentials?user_id=eq.${currentUser.id}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!credentialsResponse.ok) {
      console.log('❌ Erro ao buscar credenciais:', credentialsResponse.status);
      return;
    }
    
    const credentials = await credentialsResponse.json();
    if (credentials.length === 0) {
      console.log('❌ Nenhuma credencial Google encontrada para o usuário');
      return;
    }
    
    const userCredentials = credentials[0];
    console.log('✅ Credenciais encontradas:');
    console.log('  - Client ID:', userCredentials.client_id ? 'Configurado' : '❌ Ausente');
    console.log('  - Client Secret:', userCredentials.client_secret ? 'Configurado' : '❌ Ausente');
    console.log('  - Redirect URI:', userCredentials.redirect_uri);
    
    // 2. Verificar se as credenciais estão válidas
    console.log('\n🔍 2. VERIFICANDO VALIDADE DAS CREDENCIAIS...');
    
    if (!userCredentials.client_id || !userCredentials.client_secret) {
      console.log('❌ Credenciais incompletas - Client ID ou Secret ausente');
      return;
    }
    
    // 3. Verificar redirect URI
    console.log('\n🔗 3. VERIFICANDO REDIRECT URI...');
    const expectedRedirectUri = 'http://localhost:8080/auth/google/callback';
    const actualRedirectUri = userCredentials.redirect_uri;
    
    console.log('  - Esperado:', expectedRedirectUri);
    console.log('  - Configurado:', actualRedirectUri);
    console.log('  - Match:', actualRedirectUri === expectedRedirectUri ? '✅' : '❌');
    
    if (actualRedirectUri !== expectedRedirectUri) {
      console.log('❌ PROBLEMA: Redirect URI não confere!');
      console.log('🔧 SOLUÇÃO: Atualizar redirect URI no Supabase');
      return;
    }
    
    // 4. Testar geração de URL de autorização
    console.log('\n🌐 4. TESTANDO GERAÇÃO DE URL DE AUTORIZAÇÃO...');
    
    // Simular a geração da URL
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ];
    
    const params = new URLSearchParams({
      client_id: userCredentials.client_id,
      redirect_uri: userCredentials.redirect_uri,
      scope: scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'select_account consent',
      include_granted_scopes: 'true'
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('✅ URL de autorização gerada:');
    console.log('  - Client ID:', userCredentials.client_id);
    console.log('  - Redirect URI:', userCredentials.redirect_uri);
    console.log('  - Scopes:', scopes.join(', '));
    
    // 5. Verificar se o Client ID está registrado no Google Cloud Console
    console.log('\n🔍 5. VERIFICANDO REGISTRO NO GOOGLE CLOUD CONSOLE...');
    console.log('⚠️  Para verificar se o Client ID está registrado:');
    console.log('  1. Acesse: https://console.cloud.google.com/');
    console.log('  2. Vá para APIs & Services > Credentials');
    console.log('  3. Verifique se existe um OAuth 2.0 Client ID com:');
    console.log('     - Client ID:', userCredentials.client_id);
    console.log('     - Authorized redirect URIs:', userCredentials.redirect_uri);
    
    // 6. Verificar se o projeto está ativo
    console.log('\n🔍 6. VERIFICANDO STATUS DO PROJETO...');
    console.log('⚠️  Verifique se:');
    console.log('  - O projeto Google Cloud está ativo');
    console.log('  - A Google Calendar API está habilitada');
    console.log('  - O OAuth consent screen está configurado');
    console.log('  - O usuário está adicionado como test user (se necessário)');
    
    // 7. Sugestões de correção
    console.log('\n🔧 7. SUGESTÕES DE CORREÇÃO...');
    console.log('Se o erro 400 persistir, tente:');
    console.log('1. Verificar se o Client ID está correto no Google Cloud Console');
    console.log('2. Verificar se o Redirect URI está exatamente igual');
    console.log('3. Verificar se o projeto está ativo e a API habilitada');
    console.log('4. Limpar cache do navegador e tentar novamente');
    console.log('5. Verificar se não há caracteres especiais nas credenciais');
    
    console.log('\n✅ DIAGNÓSTICO CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
  }
}

// Executar diagnóstico
debugOAuth400();






