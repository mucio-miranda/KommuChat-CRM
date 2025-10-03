/**
 * Script para verificar tabelas no Supabase CRM (wywzdtyjzzmcehrsalvn)
 * Execute este script no console do navegador
 */

console.log('🔍 Verificando tabelas no Supabase CRM...');
console.log('🌐 URL: https://wywzdtyjzzmcehrsalvn.supabase.co');

async function checkCRMTables() {
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY';
    
    const tables = [
        'clientes',
        'usuarios', 
        'configuracoes_cliente',
        'google_credentials',
        'google_calendar_tokens'
    ];

    console.log('📋 Verificando tabelas do CRM...');
    
    for (const table of tables) {
        try {
            console.log(`\n🔍 Testando: ${table}`);
            
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
                method: 'GET',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log(`📡 Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${table}: OK (${data.length} registros)`);
                
                // Se conseguir acessar, mostrar contagem total
                try {
                    const countResponse = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
                        method: 'GET',
                        headers: {
                            'apikey': supabaseKey,
                            'Authorization': `Bearer ${supabaseKey}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (countResponse.ok) {
                        const countData = await countResponse.json();
                        console.log(`📊 ${table}: ${countData.length} registros totais`);
                    }
                } catch (countError) {
                    console.log(`⚠️ ${table}: Não foi possível contar registros`);
                }
                
            } else if (response.status === 401) {
                console.log(`❌ ${table}: Não autorizado (RLS ativo?)`);
            } else if (response.status === 404) {
                console.log(`❌ ${table}: Tabela não existe`);
            } else {
                const errorText = await response.text();
                console.log(`⚠️ ${table}: Erro ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error(`❌ ${table}: Erro de rede - ${error.message}`);
        }
    }
    
    console.log('\n🏁 Verificação concluída!');
}

// Executar verificação
checkCRMTables();
