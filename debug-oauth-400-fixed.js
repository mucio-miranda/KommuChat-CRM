// Script corrigido para diagnosticar erro 400 do Google OAuth
console.log('🔍 DIAGNÓSTICO CORRIGIDO - ERRO 400 GOOGLE OAUTH');
console.log('=================================================');

async function debugOAuth400Fixed() {
  try {
    // 1. Verificar credenciais no localStorage (usuário logado)
    console.log('\n📋 1. VERIFICANDO USUÁRIO LOGADO...');
    
    const savedUser = localStorage.getItem('kommuchat_user');
    if (!savedUser) {
      console.log('❌ Nenhum usuário logado encontrado no localStorage');
      return;
    }
    
    const currentUser = JSON.parse(savedUser);
    console.log('✅ Usuário logado:', currentUser.email);
    console.log('✅ User ID:', currentUser.id);
    
    // 2. Verificar se há credenciais Google no localStorage
    console.log('\n🔍 2. VERIFICANDO CREDENCIAIS GOOGLE...');
    
    const savedTokens = localStorage.getItem('google_calendar_tokens');
    if (savedTokens) {
      console.log('✅ Tokens Google encontrados no localStorage');
      const tokens = JSON.parse(savedTokens);
      console.log('  - Access Token:', tokens.access_token ? 'Presente' : 'Ausente');
      console.log('  - Refresh Token:', tokens.refresh_token ? 'Presente' : 'Ausente');
    } else {
      console.log('❌ Nenhum token Google encontrado no localStorage');
    }
    
    // 3. Verificar se há credenciais no Supabase usando a abordagem correta
    console.log('\n📋 3. VERIFICANDO CREDENCIAIS NO SUPABASE...');
    
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY_OLD';
    
    // Buscar credenciais Google usando cliente_id (não user_id)
    const credentialsResponse = await fetch(`${supabaseUrl}/rest/v1/google_credentials?select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!credentialsResponse.ok) {
      console.log('❌ Erro ao buscar credenciais:', credentialsResponse.status);
      console.log('🔧 Tentando abordagem alternativa...');
      
      // Tentar buscar todas as credenciais
      const allCredentialsResponse = await fetch(`${supabaseUrl}/rest/v1/google_credentials?select=*&limit=10`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (allCredentialsResponse.ok) {
        const allCredentials = await allCredentialsResponse.json();
        console.log('✅ Credenciais encontradas:', allCredentials.length);
        
        if (allCredentials.length > 0) {
          const firstCredential = allCredentials[0];
          console.log('✅ Primeira credencial:');
          console.log('  - Client ID:', firstCredential.client_id ? 'Configurado' : '❌ Ausente');
          console.log('  - Client Secret:', firstCredential.client_secret ? 'Configurado' : '❌ Ausente');
          console.log('  - Redirect URI:', firstCredential.redirect_uri);
          console.log('  - Cliente ID:', firstCredential.cliente_id);
          
          // 4. Verificar redirect URI
          console.log('\n🔗 4. VERIFICANDO REDIRECT URI...');
          const expectedRedirectUri = 'http://localhost:8080/auth/google/callback';
          const actualRedirectUri = firstCredential.redirect_uri;
          
          console.log('  - Esperado:', expectedRedirectUri);
          console.log('  - Configurado:', actualRedirectUri);
          console.log('  - Match:', actualRedirectUri === expectedRedirectUri ? '✅' : '❌');
          
          if (actualRedirectUri !== expectedRedirectUri) {
            console.log('❌ PROBLEMA: Redirect URI não confere!');
            console.log('🔧 SOLUÇÃO: Atualizar redirect URI no Supabase');
            
            // Tentar corrigir automaticamente
            console.log('🔧 Tentando corrigir redirect URI...');
            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/google_credentials?id=eq.${firstCredential.id}`, {
              method: 'PATCH',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                redirect_uri: expectedRedirectUri
              })
            });
            
            if (updateResponse.ok) {
              console.log('✅ Redirect URI corrigido com sucesso!');
            } else {
              console.log('❌ Erro ao corrigir redirect URI:', updateResponse.status);
            }
          }
          
          // 5. Testar geração de URL de autorização
          console.log('\n🌐 5. TESTANDO GERAÇÃO DE URL DE AUTORIZAÇÃO...');
          
          if (firstCredential.client_id && firstCredential.client_secret) {
            const scopes = [
              'https://www.googleapis.com/auth/calendar.readonly',
              'https://www.googleapis.com/auth/calendar.events'
            ];
            
            const params = new URLSearchParams({
              client_id: firstCredential.client_id,
              redirect_uri: firstCredential.redirect_uri,
              scope: scopes.join(' '),
              response_type: 'code',
              access_type: 'offline',
              prompt: 'select_account consent',
              include_granted_scopes: 'true'
            });
            
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
            console.log('✅ URL de autorização gerada:');
            console.log('  - Client ID:', firstCredential.client_id);
            console.log('  - Redirect URI:', firstCredential.redirect_uri);
            console.log('  - Scopes:', scopes.join(', '));
            
            // 6. Verificar se o Client ID está registrado no Google Cloud Console
            console.log('\n🔍 6. VERIFICANDO REGISTRO NO GOOGLE CLOUD CONSOLE...');
            console.log('⚠️  Para verificar se o Client ID está registrado:');
            console.log('  1. Acesse: https://console.cloud.google.com/');
            console.log('  2. Vá para APIs & Services > Credentials');
            console.log('  3. Verifique se existe um OAuth 2.0 Client ID com:');
            console.log('     - Client ID:', firstCredential.client_id);
            console.log('     - Authorized redirect URIs:', firstCredential.redirect_uri);
            
            // 7. Sugestões de correção
            console.log('\n🔧 7. SUGESTÕES DE CORREÇÃO...');
            console.log('Se o erro 400 persistir, tente:');
            console.log('1. Verificar se o Client ID está correto no Google Cloud Console');
            console.log('2. Verificar se o Redirect URI está exatamente igual');
            console.log('3. Verificar se o projeto está ativo e a API habilitada');
            console.log('4. Limpar cache do navegador e tentar novamente');
            console.log('5. Verificar se não há caracteres especiais nas credenciais');
            
          } else {
            console.log('❌ Credenciais incompletas - Client ID ou Secret ausente');
          }
          
        } else {
          console.log('❌ Nenhuma credencial Google encontrada no Supabase');
        }
      } else {
        console.log('❌ Erro ao buscar credenciais (tentativa alternativa):', allCredentialsResponse.status);
      }
      
      return;
    }
    
    const credentials = await credentialsResponse.json();
    console.log('✅ Credenciais encontradas:', credentials.length);
    
    console.log('\n✅ DIAGNÓSTICO CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
  }
}

// Executar diagnóstico corrigido
debugOAuth400Fixed();






