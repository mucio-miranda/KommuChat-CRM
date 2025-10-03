#!/usr/bin/env node

/**
 * Script para testar a criação de tabelas
 * Este script testa se o sistema consegue criar tabelas no Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your_supabase_project_url';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key';

if (supabaseUrl === 'your_supabase_project_url' || supabaseServiceKey === 'your_service_role_key') {
  console.error('❌ Configure as variáveis de ambiente:');
  console.error('   VITE_SUPABASE_URL=your_supabase_project_url');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTableCreation() {
  try {
    console.log('🧪 Testando criação de tabelas...\n');

    // Teste 1: Verificar se a função create_cliente_tables existe
    console.log('1️⃣ Testando função create_cliente_tables...');
    try {
      const { error } = await supabase.rpc('create_cliente_tables', {
        cliente_id: 'test-123',
        table_prefix: 'test_clinica'
      });

      if (error) {
        console.log('⚠️ Função create_cliente_tables não disponível:', error.message);
      } else {
        console.log('✅ Função create_cliente_tables funcionando');
      }
    } catch (err) {
      console.log('❌ Erro ao testar função create_cliente_tables:', err.message);
    }

    // Teste 2: Verificar se a função exec_sql existe
    console.log('\n2️⃣ Testando função exec_sql...');
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: 'SELECT 1 as test;' 
      });

      if (error) {
        console.log('⚠️ Função exec_sql não disponível:', error.message);
      } else {
        console.log('✅ Função exec_sql funcionando');
      }
    } catch (err) {
      console.log('❌ Erro ao testar função exec_sql:', err.message);
    }

    // Teste 3: Tentar criar uma tabela de teste
    console.log('\n3️⃣ Testando criação de tabela de teste...');
    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS test_table_creation (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          nome VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

      if (error) {
        console.log('❌ Erro ao criar tabela de teste:', error.message);
      } else {
        console.log('✅ Tabela de teste criada com sucesso');
        
        // Verificar se a tabela foi criada
        const { data, error: checkError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'test_table_creation')
          .single();

        if (checkError || !data) {
          console.log('⚠️ Tabela criada mas não encontrada na verificação');
        } else {
          console.log('✅ Tabela verificada com sucesso');
        }
      }
    } catch (err) {
      console.log('❌ Erro ao testar criação de tabela:', err.message);
    }

    // Teste 4: Listar tabelas existentes
    console.log('\n4️⃣ Listando tabelas existentes...');
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', 'clinica_%')
        .order('table_name');

      if (error) {
        console.log('❌ Erro ao listar tabelas:', error.message);
      } else {
        console.log(`✅ Encontradas ${data.length} tabelas de clientes:`);
        data.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
      }
    } catch (err) {
      console.log('❌ Erro ao listar tabelas:', err.message);
    }

    // Teste 5: Verificar permissões
    console.log('\n5️⃣ Testando permissões...');
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome')
        .limit(1);

      if (error) {
        console.log('❌ Erro ao acessar tabela clientes:', error.message);
      } else {
        console.log('✅ Acesso à tabela clientes funcionando');
      }
    } catch (err) {
      console.log('❌ Erro ao testar permissões:', err.message);
    }

    console.log('\n🎯 Resumo dos Testes:');
    console.log('- Se a função create_cliente_tables funcionar, o sistema usará ela');
    console.log('- Se não funcionar, tentará usar exec_sql');
    console.log('- Se nenhuma funcionar, o sistema tentará verificar tabelas existentes');
    console.log('- O sistema sempre criará o cliente, mesmo se as tabelas falharem');

  } catch (error) {
    console.error('❌ Erro geral durante os testes:', error);
  }
}

// Executar testes
testTableCreation();


