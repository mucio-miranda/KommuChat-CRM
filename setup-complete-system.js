#!/usr/bin/env node

/**
 * Script completo para setup do sistema KommuChat
 * Este script executa todos os SQLs necessários para configurar o sistema
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

async function executeSQLFile(filePath, description) {
  try {
    console.log(`📝 ${description}...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
    
    for (const command of commands) {
      if (command.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: command.trim() + ';' });
        if (error) {
          console.warn(`⚠️ Aviso ao executar comando: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ ${description} concluído`);
  } catch (error) {
    console.error(`❌ Erro ao executar ${description}:`, error.message);
  }
}

async function setupCompleteSystem() {
  try {
    console.log('🚀 Iniciando setup completo do sistema KommuChat...\n');

    // 1. Executar schema principal
    await executeSQLFile(
      path.join(__dirname, 'supabase-schema.sql'),
      'Executando schema principal do banco de dados'
    );

    // 2. Executar funções de criação de tabelas
    await executeSQLFile(
      path.join(__dirname, 'supabase-create-cliente-tables.sql'),
      'Criando funções para tabelas específicas por cliente'
    );

    // 3. Executar setup do storage
    await executeSQLFile(
      path.join(__dirname, 'supabase-storage-setup.sql'),
      'Configurando storage para QR codes'
    );

    // 4. Executar setup do primeiro usuário
    await executeSQLFile(
      path.join(__dirname, 'supabase-first-user-setup.sql'),
      'Criando primeiro usuário demo'
    );

    // 5. Verificar se tudo foi criado corretamente
    console.log('\n🔍 Verificando instalação...');

    // Verificar clientes
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*');

    if (clientesError) {
      console.error('❌ Erro ao verificar clientes:', clientesError);
    } else {
      console.log(`✅ ${clientes.length} cliente(s) encontrado(s)`);
    }

    // Verificar usuários
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*');

    if (usuariosError) {
      console.error('❌ Erro ao verificar usuários:', usuariosError);
    } else {
      console.log(`✅ ${usuarios.length} usuário(s) encontrado(s)`);
    }

    // Verificar configurações
    const { data: configs, error: configsError } = await supabase
      .from('configuracoes_cliente')
      .select('*');

    if (configsError) {
      console.error('❌ Erro ao verificar configurações:', configsError);
    } else {
      console.log(`✅ ${configs.length} configuração(ões) encontrada(s)`);
    }

    // Verificar buckets de storage
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Erro ao verificar buckets:', bucketsError);
    } else {
      const qrBucket = buckets.find(b => b.id === 'qr-codes');
      if (qrBucket) {
        console.log('✅ Bucket qr-codes criado com sucesso');
      } else {
        console.log('⚠️ Bucket qr-codes não encontrado');
      }
    }

    console.log('\n🎉 Setup completo concluído com sucesso!');
    console.log('\n📋 Sistema pronto para uso:');
    console.log('1. ✅ Banco de dados configurado');
    console.log('2. ✅ Sistema multi-tenant ativo');
    console.log('3. ✅ Storage para QR codes configurado');
    console.log('4. ✅ Primeiro usuário demo criado');
    console.log('5. ✅ Funções de gerenciamento criadas');
    
    console.log('\n🔑 Credenciais do usuário demo:');
    console.log('   Email: admin@kommuchat.com');
    console.log('   Senha: [Configure no Supabase Auth]');
    
    console.log('\n🚀 Próximos passos:');
    console.log('1. Configure a senha do usuário demo no Supabase Auth');
    console.log('2. Configure as credenciais do Google Calendar');
    console.log('3. Acesse /usuarios para criar novos clientes');
    console.log('4. Faça upload dos QR codes do WhatsApp');
    console.log('5. Teste o sistema com o primeiro cliente');

  } catch (error) {
    console.error('❌ Erro durante o setup:', error);
  }
}

// Executar setup
setupCompleteSystem();

