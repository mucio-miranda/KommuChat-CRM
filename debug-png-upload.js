// Script para diagnosticar problemas com upload de arquivos PNG
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Carregar variáveis de ambiente
dotenv.config();

const crmSupabaseUrl = process.env.VITE_CRM_SUPABASE_URL;
const crmSupabaseAnonKey = process.env.VITE_CRM_SUPABASE_ANON_KEY;

if (!crmSupabaseUrl || !crmSupabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(crmSupabaseUrl, crmSupabaseAnonKey);

async function debugPNGupload() {
  console.log('🔍 Diagnosticando upload de arquivos PNG...\n');

  try {
    // 1. Verificar se a tabela existe
    console.log('1️⃣ Verificando tabela whatsapp_qr_codes...');
    const { data: tableData, error: tableError } = await supabase
      .from('whatsapp_qr_codes')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Tabela whatsapp_qr_codes não encontrada:', tableError.message);
      return;
    }
    console.log('✅ Tabela whatsapp_qr_codes existe');

    // 2. Verificar se o bucket existe
    console.log('\n2️⃣ Verificando bucket qr-codes...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError.message);
      return;
    }

    const qrCodesBucket = buckets.find(bucket => bucket.id === 'qr-codes');
    if (!qrCodesBucket) {
      console.error('❌ Bucket qr-codes não encontrado');
      return;
    }
    console.log('✅ Bucket qr-codes existe');
    console.log('   - Público:', qrCodesBucket.public);
    console.log('   - Limite de arquivo:', qrCodesBucket.file_size_limit);
    console.log('   - Tipos permitidos:', qrCodesBucket.allowed_mime_types);

    // 3. Verificar se há clientes para teste
    console.log('\n3️⃣ Verificando clientes existentes...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('id, nome')
      .limit(1);

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError.message);
      return;
    }

    if (!clientes || clientes.length === 0) {
      console.error('❌ Nenhum cliente encontrado. Crie um cliente primeiro.');
      return;
    }

    const cliente = clientes[0];
    console.log('✅ Cliente encontrado:', cliente.nome, '(' + cliente.id + ')');

    // 4. Criar arquivo PNG de teste
    console.log('\n4️⃣ Criando arquivo PNG de teste...');
    
    // Criar um PNG válido simples (1x1 pixel transparente)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, // bit depth, color type, etc.
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, // compressed data
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, // end of IDAT
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
      0x42, 0x60, 0x82
    ]);

    const testFileName = `test_qr_${Date.now()}.png`;
    const testFilePath = `cliente-${cliente.id}/${testFileName}`;

    // Criar File object
    const testFile = new File([pngData], testFileName, { 
      type: 'image/png',
      lastModified: Date.now()
    });

    console.log('✅ Arquivo PNG de teste criado:');
    console.log('   - Nome:', testFileName);
    console.log('   - Tamanho:', testFile.size, 'bytes');
    console.log('   - Tipo MIME:', testFile.type);
    console.log('   - Caminho:', testFilePath);

    // 5. Testar upload
    console.log('\n5️⃣ Testando upload do arquivo PNG...');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('qr-codes')
      .upload(testFilePath, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError);
      console.error('   - Código:', uploadError.statusCode);
      console.error('   - Mensagem:', uploadError.message);
      console.error('   - Detalhes:', uploadError.error);
      return;
    }

    console.log('✅ Upload realizado com sucesso!');
    console.log('   - Path:', uploadData.path);
    console.log('   - ID:', uploadData.id);

    // 6. Obter URL pública
    console.log('\n6️⃣ Obtendo URL pública...');
    const { data: { publicUrl } } = supabase.storage
      .from('qr-codes')
      .getPublicUrl(testFilePath);

    console.log('✅ URL pública gerada:', publicUrl);

    // 7. Testar inserção na tabela
    console.log('\n7️⃣ Testando inserção na tabela whatsapp_qr_codes...');
    
    const { data: qrCodeData, error: qrCodeError } = await supabase
      .from('whatsapp_qr_codes')
      .insert({
        cliente_id: cliente.id,
        qr_code_image_url: publicUrl,
        file_name: testFileName,
        file_size: testFile.size,
        mime_type: testFile.type,
        status: 'pending',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (qrCodeError) {
      console.error('❌ Erro ao inserir na tabela:', qrCodeError);
      console.error('   - Código:', qrCodeError.code);
      console.error('   - Mensagem:', qrCodeError.message);
      console.error('   - Detalhes:', qrCodeError.details);
      console.error('   - Hint:', qrCodeError.hint);
      return;
    }

    console.log('✅ Registro inserido na tabela com sucesso!');
    console.log('   - ID:', qrCodeData.id);
    console.log('   - Cliente ID:', qrCodeData.cliente_id);
    console.log('   - Status:', qrCodeData.status);

    // 8. Verificar se o registro foi salvo
    console.log('\n8️⃣ Verificando se o registro foi salvo...');
    const { data: savedData, error: savedError } = await supabase
      .from('whatsapp_qr_codes')
      .select('*')
      .eq('id', qrCodeData.id)
      .single();

    if (savedError) {
      console.error('❌ Erro ao verificar registro salvo:', savedError);
    } else {
      console.log('✅ Registro encontrado na tabela:');
      console.log('   - ID:', savedData.id);
      console.log('   - URL:', savedData.qr_code_image_url);
      console.log('   - Nome do arquivo:', savedData.file_name);
      console.log('   - Tamanho:', savedData.file_size);
      console.log('   - Tipo MIME:', savedData.mime_type);
      console.log('   - Status:', savedData.status);
      console.log('   - Criado em:', savedData.created_at);
    }

    // 9. Limpar arquivo de teste
    console.log('\n9️⃣ Limpando arquivo de teste...');
    await supabase.storage
      .from('qr-codes')
      .remove([testFilePath]);
    
    await supabase
      .from('whatsapp_qr_codes')
      .delete()
      .eq('id', qrCodeData.id);

    console.log('🧹 Arquivo de teste removido');

    console.log('\n🎉 Teste de upload PNG concluído com sucesso!');
    console.log('\n📋 Se o teste passou, o problema pode estar em:');
    console.log('1. Validação de arquivo no frontend');
    console.log('2. Configuração do Supabase no frontend');
    console.log('3. Políticas de acesso');
    console.log('4. Tamanho do arquivo PNG real');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar diagnóstico
debugPNGupload();


