// Script para diagnosticar a causa raiz do erro 400
console.log('🔍 DIAGNÓSTICO CAUSA RAIZ - ERRO 400');
console.log('====================================');

async function diagnose400RootCause() {
  try {
    // 1. Verificar usuário atual
    console.log('\n📋 1. VERIFICANDO USUÁRIO ATUAL...');
    
    const savedUser = localStorage.getItem('kommuchat_user');
    if (!savedUser) {
      console.log('❌ Nenhum usuário encontrado');
      return;
    }
    
    const currentUser = JSON.parse(savedUser);
    console.log('✅ Usuário:', currentUser.email);
    console.log('✅ Cliente ID:', currentUser.cliente_id);
    
    // 2. Buscar credenciais do usuário
    console.log('\n📋 2. BUSCANDO CREDENCIAIS DO USUÁRIO...');
    
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY_OLD';
    
    const response = await fetch(`${supabaseUrl}/rest/v1/google_credentials?cliente_id=eq.${currentUser.cliente_id}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Status da resposta:', response.status);
    
    if (!response.ok) {
      console.log('❌ Erro ao buscar credenciais:', response.status, response.statusText);
      return;
    }
    
    const credentials = await response.json();
    console.log('📊 Credenciais encontradas:', credentials.length);
    
    if (credentials.length === 0) {
      console.log('❌ Nenhuma credencial encontrada para o usuário');
      return;
    }
    
    const userCredential = credentials[0];
    console.log('✅ Credencial encontrada:');
    console.log('  - Cliente ID:', userCredential.cliente_id);
    console.log('  - Client ID:', userCredential.client_id ? 'Configurado (criptografado)' : 'Ausente');
    console.log('  - Client Secret:', userCredential.client_secret ? 'Configurado (criptografado)' : 'Ausente');
    console.log('  - Redirect URI:', userCredential.redirect_uri);
    console.log('  - Configured:', userCredential.configured);
    
    // 3. Verificar se as credenciais estão completas
    console.log('\n📋 3. VERIFICANDO COMPLETUDE DAS CREDENCIAIS...');
    
    if (!userCredential.client_id || !userCredential.client_secret) {
      console.log('❌ Credenciais incompletas!');
      console.log('  - Client ID:', userCredential.client_id ? 'Presente' : 'AUSENTE');
      console.log('  - Client Secret:', userCredential.client_secret ? 'Presente' : 'AUSENTE');
      console.log('🔧 SOLUÇÃO: Configure as credenciais no Gerenciador de Usuários');
      return;
    }
    
    console.log('✅ Credenciais completas');
    
    // 4. Verificar redirect URI
    console.log('\n📋 4. VERIFICANDO REDIRECT URI...');
    
    const expectedRedirectUri = 'http://localhost:8080/auth/google/callback';
    const actualRedirectUri = userCredential.redirect_uri;
    
    console.log('  - Esperado:', expectedRedirectUri);
    console.log('  - Atual:', actualRedirectUri);
    console.log('  - Match:', actualRedirectUri === expectedRedirectUri ? '✅' : '❌');
    
    if (actualRedirectUri !== expectedRedirectUri) {
      console.log('❌ Redirect URI incorreto!');
      console.log('🔧 SOLUÇÃO: Execute o script fix-all-redirect-uris.sql');
      return;
    }
    
    console.log('✅ Redirect URI correto');
    
    // 5. Testar geração de URL de autorização
    console.log('\n📋 5. TESTANDO GERAÇÃO DE URL DE AUTORIZAÇÃO...');
    
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ];
    
    const params = new URLSearchParams({
      client_id: userCredential.client_id,
      redirect_uri: userCredential.redirect_uri,
      scope: scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'select_account consent',
      include_granted_scopes: 'true'
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('✅ URL de autorização gerada:');
    console.log('  - Client ID:', userCredential.client_id);
    console.log('  - Redirect URI:', userCredential.redirect_uri);
    console.log('  - Scopes:', scopes.join(', '));
    
    // 6. Verificar se o Client ID está registrado no Google Cloud Console
    console.log('\n📋 6. VERIFICANDO REGISTRO NO GOOGLE CLOUD CONSOLE...');
    console.log('⚠️  Para verificar se o Client ID está registrado:');
    console.log('  1. Acesse: https://console.cloud.google.com/');
    console.log('  2. Vá para APIs & Services > Credentials');
    console.log('  3. Verifique se existe um OAuth 2.0 Client ID com:');
    console.log('     - Client ID:', userCredential.client_id);
    console.log('     - Authorized redirect URIs:', userCredential.redirect_uri);
    
    // 7. Verificar se o projeto está ativo
    console.log('\n📋 7. VERIFICANDO STATUS DO PROJETO...');
    console.log('⚠️  Verifique se:');
    console.log('  - O projeto Google Cloud está ativo');
    console.log('  - A Google Calendar API está habilitada');
    console.log('  - O OAuth consent screen está configurado');
    console.log('  - O usuário está adicionado como test user (se necessário)');
    
    // 8. Testar a URL gerada
    console.log('\n📋 8. TESTANDO URL GERADA...');
    console.log('🔗 URL completa:');
    console.log(authUrl);
    
    // 9. Sugestões de correção
    console.log('\n🔧 9. SUGESTÕES DE CORREÇÃO...');
    console.log('Se o erro 400 persistir, verifique:');
    console.log('1. ✅ Client ID está correto no Google Cloud Console');
    console.log('2. ✅ Redirect URI está exatamente igual');
    console.log('3. ✅ Projeto está ativo e API habilitada');
    console.log('4. ✅ OAuth consent screen configurado');
    console.log('5. ✅ Usuário adicionado como test user (se necessário)');
    console.log('6. ✅ Limpar cache do navegador');
    console.log('7. ✅ Verificar se não há caracteres especiais nas credenciais');
    
    console.log('\n✅ DIAGNÓSTICO CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnose400RootCause();






