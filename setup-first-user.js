#!/usr/bin/env node

/**
 * Script para criar o primeiro usuário do KommuChat
 * Este script executa o SQL de setup e configura o primeiro cliente
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function setupFirstUser() {
  try {
    console.log('🚀 Iniciando setup do primeiro usuário KommuChat...');

    // 1. Ler e executar o SQL de setup
    const setupSQL = fs.readFileSync(path.join(__dirname, 'supabase-first-user-setup.sql'), 'utf8');
    
    console.log('📝 Executando SQL de setup...');
    const { error: setupError } = await supabase.rpc('exec_sql', { sql: setupSQL });
    
    if (setupError) {
      console.error('❌ Erro ao executar SQL de setup:', setupError);
      return;
    }

    // 2. Ler e executar o SQL de criação de tabelas
    const tablesSQL = fs.readFileSync(path.join(__dirname, 'supabase-create-cliente-tables.sql'), 'utf8');
    
    console.log('📊 Criando funções de tabelas...');
    const { error: tablesError } = await supabase.rpc('exec_sql', { sql: tablesSQL });
    
    if (tablesError) {
      console.error('❌ Erro ao criar funções de tabelas:', tablesError);
      return;
    }

    // 3. Verificar se o cliente foi criado
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', '550e8400-e29b-41d4-a716-446655440001');

    if (clientesError) {
      console.error('❌ Erro ao verificar cliente:', clientesError);
      return;
    }

    if (clientes && clientes.length > 0) {
      console.log('✅ Cliente criado com sucesso:');
      console.log(`   Nome: ${clientes[0].nome}`);
      console.log(`   Email: ${clientes[0].email}`);
      console.log(`   Tipo: ${clientes[0].tipo}`);
    }

    // 4. Verificar se o usuário foi criado
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', '550e8400-e29b-41d4-a716-446655440002');

    if (usuariosError) {
      console.error('❌ Erro ao verificar usuário:', usuariosError);
      return;
    }

    if (usuarios && usuarios.length > 0) {
      console.log('✅ Usuário criado com sucesso:');
      console.log(`   Nome: ${usuarios[0].nome}`);
      console.log(`   Email: ${usuarios[0].email}`);
      console.log(`   Role: ${usuarios[0].role}`);
    }

    // 5. Verificar configurações
    const { data: configs, error: configsError } = await supabase
      .from('configuracoes_cliente')
      .select('*')
      .eq('cliente_id', '550e8400-e29b-41d4-a716-446655440001');

    if (configsError) {
      console.error('❌ Erro ao verificar configurações:', configsError);
      return;
    }

    console.log(`✅ ${configs.length} configurações criadas`);

    // 6. Verificar tabelas específicas
    const { data: pacientes, error: pacientesError } = await supabase
      .from('clinica_kommuchat_pacientes')
      .select('*');

    if (pacientesError) {
      console.warn('⚠️ Tabela de pacientes não encontrada (normal se não foi criada)');
    } else {
      console.log(`✅ ${pacientes.length} pacientes de exemplo criados`);
    }

    console.log('\n🎉 Setup concluído com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Configure as credenciais do Google Calendar para o usuário');
    console.log('2. Configure a Evolution API para WhatsApp');
    console.log('3. Acesse o sistema com as credenciais criadas');
    console.log('\n🔑 Credenciais de acesso:');
    console.log('   Email: admin@kommuchat.com');
    console.log('   Senha: [Configure no Supabase Auth]');

  } catch (error) {
    console.error('❌ Erro durante o setup:', error);
  }
}

// Executar setup
setupFirstUser();

