// Testar se o problema da tabela client_0 foi resolvido
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configurações do Supabase KommuChat
const kommuUrl = process.env.VITE_SUPABASE_URL;
const kommuAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!kommuUrl || !kommuAnonKey) {
  console.error('❌ Configurações do Supabase KommuChat não encontradas');
  process.exit(1);
}

const supabaseKommu = createClient(kommuUrl, kommuAnonKey);

async function testClient0Fix() {
  console.log('🔍 Testando se o problema da tabela client_0 foi resolvido...\n');

  try {
    // 1. Verificar count da tabela client_0
    console.log('1️⃣ Verificando count da tabela client_0:');
    const { count: client0Count, error: client0CountError } = await supabaseKommu
      .from('client_0')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 client_0 count: ${client0Count} registros`);
    console.log(`   - Erro: ${client0CountError ? client0CountError.message : 'null'}`);

    // 2. Verificar dados da tabela client_0
    console.log('\n2️⃣ Verificando dados da tabela client_0:');
    const { data: client0Data, error: client0DataError } = await supabaseKommu
      .from('client_0')
      .select('*');

    console.log(`📊 client_0 dados: ${client0Data ? client0Data.length : 'null'} registros`);
    console.log(`   - Erro: ${client0DataError ? client0DataError.message : 'null'}`);

    if (client0Data && client0Data.length > 0) {
      console.log('📋 Dados encontrados:');
      client0Data.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}, Nome: ${record.nome}, Telefone: ${record.telefone}`);
      });
    }

    // 3. Testar inserção na tabela client_0
    console.log('\n3️⃣ Testando inserção na tabela client_0:');
    const testRecord = {
      nome: 'Teste RLS Fix',
      telefone: '11555555555',
      chatid: '11555555555',
      atende_humano: false,
      email: 'teste@rlsfix.com',
      setdata: new Date().toISOString(),
      followup: false,
      topoucall: null,
      atendimentofinal: false
    };

    const { data: insertData, error: insertError } = await supabaseKommu
      .from('client_0')
      .insert([testRecord])
      .select();

    if (insertError) {
      console.log(`❌ Erro na inserção: ${insertError.message}`);
      console.log(`   - Código: ${insertError.code}`);
    } else {
      console.log(`✅ Inserção bem-sucedida: ${insertData.length} registros`);
      if (insertData.length > 0) {
        console.log(`   - ID: ${insertData[0].id}, Nome: ${insertData[0].nome}`);
      }
    }

    // 4. Verificar count final
    console.log('\n4️⃣ Count final:');
    const { count: finalCount, error: finalCountError } = await supabaseKommu
      .from('client_0')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Count final: ${finalCount} registros`);
    console.log(`   - Erro: ${finalCountError ? finalCountError.message : 'null'}`);

    // 5. Comparar com kommuchat_mvp
    console.log('\n5️⃣ Comparando com kommuchat_mvp:');
    const { data: mvpData, error: mvpError } = await supabaseKommu
      .from('kommuchat_mvp')
      .select('*')
      .limit(3);

    console.log(`📊 kommuchat_mvp: ${mvpData ? mvpData.length : 'null'} registros`);
    console.log(`   - Erro: ${mvpError ? mvpError.message : 'null'}`);

    // 6. Conclusão
    console.log('\n6️⃣ Conclusão:');
    if (finalCount > 0) {
      console.log('✅ PROBLEMA RESOLVIDO!');
      console.log(`🎯 Tabela client_0 tem ${finalCount} registros e está acessível via API`);
      console.log('🚀 Sistema funcionando corretamente');
    } else {
      console.log('⚠️ Tabela client_0 ainda está vazia');
      console.log('💡 Execute o script fix-client-0-rls.sql no Supabase');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testClient0Fix();

