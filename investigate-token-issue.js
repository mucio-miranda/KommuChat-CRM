/**
 * Script para investigar problema específico com tokens do Google Calendar
 * Execute este script no console do navegador
 */

console.log('🔍 Investigando problema com tokens do Google Calendar...');

async function investigateTokenIssue() {
    try {
        // 1. Verificar usuário atual
        const savedUser = localStorage.getItem('kommuchat_user');
        if (!savedUser) {
            console.log('❌ Nenhum usuário encontrado no localStorage');
            return;
        }
        
        const userData = JSON.parse(savedUser);
        console.log('✅ Usuário atual:', {
            email: userData.email,
            cliente_id: userData.cliente_id
        });
        
        // 2. Configurações do Supabase
        const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
        const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY';
        
        // 3. Verificar estrutura da tabela google_calendar_tokens
        console.log('\n🔍 Verificando estrutura da tabela google_calendar_tokens...');
        
        const tableInfoResponse = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?select=*&limit=1`, {
            method: 'GET',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        console.log('📡 Status da resposta da tabela:', tableInfoResponse.status);
        
        if (tableInfoResponse.ok) {
            const tableData = await tableInfoResponse.json();
            console.log('✅ Tabela acessível, registros encontrados:', tableData.length);
            
            if (tableData.length > 0) {
                console.log('📋 Estrutura do primeiro registro:', Object.keys(tableData[0]));
            }
        } else {
            const errorText = await tableInfoResponse.text();
            console.log('❌ Erro ao acessar tabela:', tableInfoResponse.status, errorText);
        }
        
        // 4. Testar inserção de token de teste
        console.log('\n🧪 Testando inserção de token de teste...');
        
        const testToken = {
            user_id: userData.email,
            access_token: 'test_access_token_123',
            refresh_token: 'test_refresh_token_456',
            expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hora no futuro
            scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
            token_type: 'Bearer'
        };
        
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(testToken)
        });
        
        console.log('📡 Status da inserção:', insertResponse.status);
        
        if (insertResponse.ok) {
            const insertedData = await insertResponse.json();
            console.log('✅ Token de teste inserido com sucesso:', insertedData[0].id);
            
            // 5. Testar leitura do token inserido
            console.log('\n🔍 Testando leitura do token inserido...');
            
            const readResponse = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?select=*&user_id=eq.${userData.email}`, {
                method: 'GET',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (readResponse.ok) {
                const readData = await readResponse.json();
                console.log('✅ Token lido com sucesso:', readData.length, 'registros');
                
                if (readData.length > 0) {
                    console.log('📋 Detalhes do token:', {
                        id: readData[0].id,
                        user_id: readData[0].user_id,
                        access_token: readData[0].access_token ? 'Presente' : 'Ausente',
                        refresh_token: readData[0].refresh_token ? 'Presente' : 'Ausente',
                        expires_at: readData[0].expires_at,
                        scope: readData[0].scope
                    });
                }
                
                // 6. Limpar token de teste
                console.log('\n🧹 Limpando token de teste...');
                
                const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?id=eq.${insertedData[0].id}`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                if (deleteResponse.ok) {
                    console.log('✅ Token de teste removido');
                } else {
                    console.log('⚠️ Erro ao remover token de teste:', deleteResponse.status);
                }
                
            } else {
                const readErrorText = await readResponse.text();
                console.log('❌ Erro ao ler token:', readResponse.status, readErrorText);
            }
            
        } else {
            const insertErrorText = await insertResponse.text();
            console.log('❌ Erro ao inserir token de teste:', insertResponse.status, insertErrorText);
        }
        
        // 7. Verificar se há algum problema com RLS
        console.log('\n🔒 Verificando políticas RLS...');
        
        const rlsResponse = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?select=*`, {
            method: 'GET',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        console.log('📡 Status da consulta geral:', rlsResponse.status);
        
        if (rlsResponse.ok) {
            const allTokens = await rlsResponse.json();
            console.log('✅ Consulta geral funcionou, total de tokens:', allTokens.length);
        } else {
            const rlsErrorText = await rlsResponse.text();
            console.log('❌ Problema com RLS ou permissões:', rlsResponse.status, rlsErrorText);
        }
        
        console.log('\n🏁 Investigação concluída!');
        
        // 8. Resumo dos problemas encontrados
        console.log('\n📊 RESUMO DOS PROBLEMAS:');
        console.log('1. Se a tabela não é acessível (erro 401/403): Problema de RLS');
        console.log('2. Se a inserção falha (erro 400): Problema de schema/colunas');
        console.log('3. Se a leitura falha: Problema de permissões ou estrutura');
        console.log('4. Se tudo funciona: O problema está no código da aplicação');
        
    } catch (error) {
        console.error('❌ Erro geral na investigação:', error);
    }
}

// Executar investigação
investigateTokenIssue();
