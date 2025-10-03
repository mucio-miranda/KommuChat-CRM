/**
 * Script para testar o formato correto da requisição para o Supabase
 * Execute este script no console do navegador
 */

console.log('🧪 Testando formato correto da requisição...');

// Configurações do Supabase CRM
const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY_V1';

// Função para testar a API com formato correto
async function testCorrectRequestFormat() {
    try {
        console.log('🔍 Testando busca de tokens com formato correto...');
        
        // Teste 1: Buscar tokens existentes com formato correto
        const response = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?select=*&user_id=eq.muciohh@gmail.com`, {
            method: 'GET',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log('📡 Status da resposta:', response.status);
        console.log('📡 Headers da resposta:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Dados recebidos:', data);
        } else {
            const errorText = await response.text();
            console.error('❌ Erro na resposta:', errorText);
        }

        // Teste 2: Inserir token de teste com formato correto
        console.log('🔍 Testando inserção de token com formato correto...');
        
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                user_id: 'muciohh@gmail.com',
                access_token: 'test_access_token_correct_format',
                refresh_token: 'test_refresh_token_correct_format',
                token_type: 'Bearer',
                expires_in: 3600,
                scope: 'calendar.readonly calendar.events'
            })
        });

        console.log('📡 Status da inserção:', insertResponse.status);
        
        if (insertResponse.ok) {
            console.log('✅ Token inserido com sucesso!');
        } else {
            const errorText = await insertResponse.text();
            console.error('❌ Erro na inserção:', errorText);
        }

        // Teste 3: Buscar novamente
        console.log('🔍 Testando busca após inserção...');
        
        const finalResponse = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?select=*&user_id=eq.muciohh@gmail.com`, {
            method: 'GET',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log('📡 Status da busca final:', finalResponse.status);
        
        if (finalResponse.ok) {
            const finalData = await finalResponse.json();
            console.log('✅ Dados finais:', finalData);
        } else {
            const errorText = await finalResponse.text();
            console.error('❌ Erro na busca final:', errorText);
        }

    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

// Executar teste
testCorrectRequestFormat();
