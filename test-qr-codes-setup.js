// Script para testar a configuração de QR codes
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const crmSupabaseUrl = process.env.VITE_CRM_SUPABASE_URL;
const crmSupabaseAnonKey = process.env.VITE_CRM_SUPABASE_ANON_KEY;

if (!crmSupabaseUrl || !crmSupabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas:');
  console.error('VITE_CRM_SUPABASE_URL:', crmSupabaseUrl ? '✅' : '❌');
  console.error('VITE_CRM_SUPABASE_ANON_KEY:', crmSupabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(crmSupabaseUrl, crmSupabaseAnonKey);

async function testQRCodeSetup() {
  console.log('🧪 Testando configuração de QR codes...\n');

  try {
    // 1. Verificar se a tabela whatsapp_qr_codes existe
    console.log('1️⃣ Verificando tabela whatsapp_qr_codes...');
    const { data: tableData, error: tableError } = await supabase
      .from('whatsapp_qr_codes')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Tabela whatsapp_qr_codes não encontrada:', tableError.message);
      console.log('💡 Execute o arquivo create-qr-codes-table.sql no Supabase SQL Editor');
      return;
    }
    console.log('✅ Tabela whatsapp_qr_codes existe');

    // 2. Verificar se o bucket qr-codes existe
    console.log('\n2️⃣ Verificando bucket qr-codes...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError.message);
      return;
    }

    const qrCodesBucket = buckets.find(bucket => bucket.id === 'qr-codes');
    if (!qrCodesBucket) {
      console.error('❌ Bucket qr-codes não encontrado');
      console.log('💡 Execute o arquivo setup-qr-codes-storage.sql no Supabase SQL Editor');
      return;
    }
    console.log('✅ Bucket qr-codes existe');

    // 3. Testar upload de arquivo
    console.log('\n3️⃣ Testando upload de arquivo...');
    const testContent = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testFile = new File([testContent], 'test.png', { type: 'image/png' });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('qr-codes')
      .upload('test/test.png', testFile);

    if (uploadError) {
      console.error('❌ Erro no teste de upload:', uploadError.message);
      console.log('💡 Verifique as políticas de acesso do bucket');
    } else {
      console.log('✅ Upload de teste bem-sucedido');
      
      // Limpar arquivo de teste
      await supabase.storage
        .from('qr-codes')
        .remove(['test/test.png']);
      console.log('🧹 Arquivo de teste removido');
    }

    // 4. Verificar se existem clientes para teste
    console.log('\n4️⃣ Verificando clientes existentes...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('id, nome')
      .limit(5);

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError.message);
    } else if (clientes && clientes.length > 0) {
      console.log('✅ Clientes encontrados:');
      clientes.forEach(cliente => {
        console.log(`   - ${cliente.nome} (${cliente.id})`);
      });
    } else {
      console.log('⚠️ Nenhum cliente encontrado');
      console.log('💡 Crie um cliente primeiro no UserManagement para testar QR codes');
    }

    // 5. Verificar QR codes existentes
    console.log('\n5️⃣ Verificando QR codes existentes...');
    const { data: qrCodes, error: qrCodesError } = await supabase
      .from('whatsapp_qr_codes')
      .select('*')
      .limit(5);

    if (qrCodesError) {
      console.error('❌ Erro ao buscar QR codes:', qrCodesError.message);
    } else if (qrCodes && qrCodes.length > 0) {
      console.log('✅ QR codes encontrados:');
      qrCodes.forEach(qr => {
        console.log(`   - ${qr.file_name} (${qr.status}) - Cliente: ${qr.cliente_id}`);
      });
    } else {
      console.log('ℹ️ Nenhum QR code encontrado ainda');
    }

    console.log('\n🎉 Teste de configuração concluído!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Acesse http://localhost:8080/admin/dashboard');
    console.log('2. Crie um novo cliente ou edite um existente');
    console.log('3. Faça upload de um QR code PNG');
    console.log('4. Verifique se o QR code aparece na lista');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testQRCodeSetup();






