/**
 * Script para diagnosticar o erro específico do Google Calendar
 * Execute este script no console do navegador
 */

console.log('🔍 Diagnosticando erro do Google Calendar...');

async function diagnoseGoogleCalendarError() {
    console.log('📋 Verificando configurações...');
    
    // 1. Verificar se as credenciais estão carregadas
    console.log('\n1️⃣ Verificando credenciais do usuário atual...');
    
    try {
        // Simular o que o sistema faz para carregar credenciais
        const savedUser = localStorage.getItem('kommuchat_user');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            console.log('✅ Usuário encontrado:', {
                id: userData.id,
                email: userData.email,
                cliente_id: userData.cliente_id
            });
            
            // 2. Verificar se há credenciais Google para este cliente
            console.log('\n2️⃣ Verificando credenciais Google no Supabase...');
            
            const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
            const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY';
            
            const response = await fetch(`${supabaseUrl}/rest/v1/google_credentials?select=*&cliente_id=eq.${userData.cliente_id}`, {
                method: 'GET',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            console.log('📡 Status da resposta:', response.status);
            
            if (response.ok) {
                const credentials = await response.json();
                console.log('✅ Credenciais encontradas:', credentials.length);
                
                if (credentials.length > 0) {
                    const cred = credentials[0];
                    console.log('📋 Detalhes das credenciais:', {
                        id: cred.id,
                        cliente_id: cred.cliente_id,
                        client_id: cred.client_id ? 'Configurado' : 'Não configurado',
                        client_secret: cred.client_secret ? 'Configurado' : 'Não configurado',
                        redirect_uri: cred.redirect_uri,
                        configured: cred.configured
                    });
                    
                    // 3. Testar se as credenciais são válidas
                    console.log('\n3️⃣ Testando validade das credenciais...');
                    
                    if (cred.client_id && cred.client_secret && cred.redirect_uri) {
                        console.log('✅ Todas as credenciais estão presentes');
                        
                        // 4. Testar geração da URL de autorização
                        console.log('\n4️⃣ Testando geração da URL de autorização...');
                        
                        try {
                            // Simular o que o GoogleCalendarService faz
                            const SCOPES = [
                                'https://www.googleapis.com/auth/calendar.readonly',
                                'https://www.googleapis.com/auth/calendar.events'
                            ];
                            
                            // Gerar code verifier (PKCE)
                            const array = new Uint8Array(32);
                            crypto.getRandomValues(array);
                            const codeVerifier = btoa(String.fromCharCode.apply(null, Array.from(array)))
                                .replace(/\+/g, '-')
                                .replace(/\//g, '_')
                                .replace(/=/g, '');
                            
                            // Gerar code challenge (PKCE)
                            const encoder = new TextEncoder();
                            const data = encoder.encode(codeVerifier);
                            const digest = await crypto.subtle.digest('SHA-256', data);
                            const codeChallenge = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
                                .replace(/\+/g, '-')
                                .replace(/\//g, '_')
                                .replace(/=/g, '');
                            
                            const params = new URLSearchParams({
                                client_id: cred.client_id,
                                redirect_uri: cred.redirect_uri,
                                scope: SCOPES.join(' '),
                                response_type: 'code',
                                access_type: 'offline',
                                prompt: 'select_account consent',
                                include_granted_scopes: 'true',
                                code_challenge: codeChallenge,
                                code_challenge_method: 'S256'
                            });
                            
                            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
                            console.log('✅ URL de autorização gerada com sucesso');
                            console.log('🔗 URL:', authUrl.substring(0, 100) + '...');
                            
                            // 5. Verificar se há tokens salvos
                            console.log('\n5️⃣ Verificando tokens salvos...');
                            
                            const tokensResponse = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?select=*&user_id=eq.${userData.email}`, {
                                method: 'GET',
                                headers: {
                                    'apikey': supabaseKey,
                                    'Authorization': `Bearer ${supabaseKey}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            });
                            
                            if (tokensResponse.ok) {
                                const tokens = await tokensResponse.json();
                                console.log('📊 Tokens encontrados:', tokens.length);
                                
                                if (tokens.length > 0) {
                                    const token = tokens[0];
                                    console.log('🔑 Detalhes do token:', {
                                        id: token.id,
                                        user_id: token.user_id,
                                        access_token: token.access_token ? 'Presente' : 'Ausente',
                                        refresh_token: token.refresh_token ? 'Presente' : 'Ausente',
                                        expires_at: token.expires_at ? new Date(token.expires_at * 1000).toISOString() : 'Não definido'
                                    });
                                } else {
                                    console.log('❌ Nenhum token encontrado - necessário conectar Google Calendar');
                                }
                            } else {
                                console.log('❌ Erro ao buscar tokens:', tokensResponse.status);
                            }
                            
                        } catch (error) {
                            console.error('❌ Erro ao testar URL de autorização:', error);
                        }
                        
                    } else {
                        console.log('❌ Credenciais incompletas:', {
                            client_id: !!cred.client_id,
                            client_secret: !!cred.client_secret,
                            redirect_uri: !!cred.redirect_uri
                        });
                    }
                    
                } else {
                    console.log('❌ Nenhuma credencial Google encontrada para este cliente');
                }
                
            } else {
                const errorText = await response.text();
                console.log('❌ Erro ao buscar credenciais:', response.status, errorText);
            }
            
        } else {
            console.log('❌ Nenhum usuário encontrado no localStorage');
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
    
    console.log('\n🏁 Diagnóstico concluído!');
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Se as credenciais estão configuradas mas não há tokens, clique em "Conectar Google Calendar"');
    console.log('2. Se há erro na URL de autorização, verifique as credenciais no Supabase');
    console.log('3. Se há tokens mas não funcionam, pode ser necessário renovar');
}

// Executar diagnóstico
diagnoseGoogleCalendarError();
