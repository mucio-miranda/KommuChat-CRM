/**
 * Script para verificar acesso às tabelas do Supabase
 * Execute este script no console do navegador
 */

console.log('🔍 Verificando acesso às tabelas do Supabase...');

async function checkTableAccess() {
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY_V1';
    
    const tables = [
        'clientes',
        'usuarios', 
        'configuracoes_cliente',
        'google_credentials',
        'google_calendar_tokens'
    ];

    for (const table of tables) {
        try {
            console.log(`🔍 Testando acesso à tabela: ${table}`);
            
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
                method: 'GET',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log(`📡 ${table}: Status ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${table}: Acesso permitido (${data.length} registros retornados)`);
            } else if (response.status === 401) {
                console.log(`❌ ${table}: Não autorizado (401) - Problema de RLS ou permissões`);
            } else if (response.status === 404) {
                console.log(`❌ ${table}: Tabela não encontrada (404)`);
            } else {
                const errorText = await response.text();
                console.log(`⚠️ ${table}: Erro ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error(`❌ ${table}: Erro de rede - ${error.message}`);
        }
    }
}

// Verificar também se as tabelas existem
async function checkTableExistence() {
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY_V1';
    
    try {
        console.log('🔍 Verificando estrutura das tabelas...');
        
        // Tentar acessar informações do schema
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_table_info`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                table_name: 'google_credentials'
            })
        });

        console.log('📡 Schema info:', response.status);
        
    } catch (error) {
        console.log('⚠️ Não foi possível verificar schema:', error.message);
    }
}

// Executar verificações
async function runDebug() {
    console.log('🚀 Iniciando verificação de acesso...');
    
    await checkTableAccess();
    await checkTableExistence();
    
    console.log('✅ Verificação concluída!');
}

// Executar debug
runDebug();
