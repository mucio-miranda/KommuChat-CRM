/**
 * Script para testar com a chave correta do Supabase CRM
 * Execute este script no console do navegador
 */

console.log('🔍 Testando chave correta do Supabase CRM...');

async function testCorrectCRMKey() {
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    
    // Testar com diferentes chaves possíveis
    const possibleKeys = [
        // Chave atual (incorreta)
        'REMOVED_SUPABASE_CRM_ANON_KEY_V1',
        
        // Chave correta do CRM (do env.example)
        'REMOVED_SUPABASE_CRM_ANON_KEY',
        
        // Chave do projeto principal (diferente)
        'REMOVED_SUPABASE_ANON_KEY'
    ];
    
    const testTable = 'clientes';
    
    for (let i = 0; i < possibleKeys.length; i++) {
        const key = possibleKeys[i];
        console.log(`\n🔑 Testando chave ${i + 1}...`);
        console.log(`📋 Chave: ${key.substring(0, 50)}...`);
        
        try {
            const response = await fetch(`${supabaseUrl}/rest/v1/${testTable}?select=*&limit=1`, {
                method: 'GET',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            console.log(`📡 Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ SUCESSO! Chave ${i + 1} funciona!`);
                console.log(`📊 Registros encontrados: ${data.length}`);
                
                // Testar outras tabelas com esta chave
                console.log('\n🔍 Testando outras tabelas com esta chave...');
                const otherTables = ['usuarios', 'google_credentials', 'google_calendar_tokens'];
                
                for (const table of otherTables) {
                    try {
                        const tableResponse = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
                            method: 'GET',
                            headers: {
                                'apikey': key,
                                'Authorization': `Bearer ${key}`,
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        });
                        
                        if (tableResponse.ok) {
                            const tableData = await tableResponse.json();
                            console.log(`✅ ${table}: OK (${tableData.length} registros)`);
                        } else {
                            console.log(`❌ ${table}: Erro ${tableResponse.status}`);
                        }
                    } catch (tableError) {
                        console.log(`❌ ${table}: Erro de rede`);
                    }
                }
                
                break; // Parar de testar outras chaves se esta funcionar
                
            } else if (response.status === 401) {
                console.log(`❌ Chave ${i + 1}: Não autorizada (401)`);
            } else if (response.status === 404) {
                console.log(`❌ Chave ${i + 1}: Tabela não existe (404)`);
            } else {
                const errorText = await response.text();
                console.log(`⚠️ Chave ${i + 1}: Erro ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error(`❌ Chave ${i + 1}: Erro de rede - ${error.message}`);
        }
    }
    
    console.log('\n🏁 Teste de chaves concluído!');
    console.log('\n💡 INSTRUÇÕES:');
    console.log('1. Se nenhuma chave funcionou, você precisa:');
    console.log('   - Ir para o Supabase CRM: https://supabase.com/dashboard/project/wywzdtyjzzmcehrsalvn');
    console.log('   - Settings > API');
    console.log('   - Copiar a chave "anon public"');
    console.log('   - Substituir no arquivo .env');
    console.log('2. Ou verificar se o projeto CRM está ativo');
}

// Executar teste
testCorrectCRMKey();
