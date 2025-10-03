/**
 * Script para corrigir o redirect URI no Supabase
 * Execute este script no console do navegador
 */

console.log('🔧 Corrigindo redirect URI no Supabase...');

async function fixRedirectUri() {
    try {
        // 1. Obter usuário atual
        const savedUser = localStorage.getItem('kommuchat_user');
        if (!savedUser) {
            console.log('❌ Nenhum usuário encontrado no localStorage');
            return;
        }
        
        const userData = JSON.parse(savedUser);
        console.log('✅ Usuário encontrado:', userData.email);
        
        // 2. Configurações do Supabase
        const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
        const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY';
        
        // 3. Buscar credenciais atuais
        console.log('\n🔍 Buscando credenciais atuais...');
        const getResponse = await fetch(`${supabaseUrl}/rest/v1/google_credentials?select=*&cliente_id=eq.${userData.cliente_id}`, {
            method: 'GET',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!getResponse.ok) {
            console.log('❌ Erro ao buscar credenciais:', getResponse.status);
            return;
        }
        
        const credentials = await getResponse.json();
        if (credentials.length === 0) {
            console.log('❌ Nenhuma credencial encontrada');
            return;
        }
        
        const cred = credentials[0];
        console.log('📋 Credencial atual:', {
            id: cred.id,
            redirect_uri: cred.redirect_uri
        });
        
        // 4. Corrigir redirect URI
        console.log('\n🔧 Corrigindo redirect URI...');
        const correctedRedirectUri = 'http://localhost:8080/auth/google/callback';
        
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/google_credentials?id=eq.${cred.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                redirect_uri: correctedRedirectUri
            })
        });
        
        if (updateResponse.ok) {
            console.log('✅ Redirect URI corrigido com sucesso!');
            console.log('🔗 Novo redirect URI:', correctedRedirectUri);
            
            // 5. Verificar se foi atualizado
            console.log('\n🔍 Verificando atualização...');
            const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/google_credentials?select=*&cliente_id=eq.${userData.cliente_id}`, {
                method: 'GET',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (verifyResponse.ok) {
                const updatedCredentials = await verifyResponse.json();
                const updatedCred = updatedCredentials[0];
                console.log('✅ Verificação concluída:', {
                    id: updatedCred.id,
                    redirect_uri: updatedCred.redirect_uri
                });
                
                console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
                console.log('💡 Agora você pode:');
                console.log('1. Ir para http://localhost:8080/calendario');
                console.log('2. Clicar em "Conectar Google Calendar"');
                console.log('3. Fazer login com sua conta Google');
                console.log('4. Autorizar o acesso ao calendário');
                
            } else {
                console.log('❌ Erro ao verificar atualização:', verifyResponse.status);
            }
            
        } else {
            const errorText = await updateResponse.text();
            console.log('❌ Erro ao atualizar redirect URI:', updateResponse.status, errorText);
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

// Executar correção
fixRedirectUri();
