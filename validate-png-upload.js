// Script para validar upload de arquivos PNG
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const crmSupabaseUrl = process.env.VITE_CRM_SUPABASE_URL;
const crmSupabaseAnonKey = process.env.VITE_CRM_SUPABASE_ANON_KEY;

if (!crmSupabaseUrl || !crmSupabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(crmSupabaseUrl, crmSupabaseAnonKey);

// Função para validar arquivo PNG
function validatePNGFile(file) {
  console.log('🔍 Validando arquivo PNG...');
  console.log('   - Nome:', file.name);
  console.log('   - Tamanho:', file.size, 'bytes');
  console.log('   - Tipo MIME:', file.type);
  console.log('   - Última modificação:', new Date(file.lastModified));

  // Verificar extensão
  const extension = file.name.split('.').pop()?.toLowerCase();
  console.log('   - Extensão:', extension);

  if (extension !== 'png') {
    console.warn('⚠️ Extensão não é .png');
  }

  // Verificar tipo MIME
  if (file.type !== 'image/png') {
    console.warn('⚠️ Tipo MIME não é image/png:', file.type);
  }

  // Verificar tamanho (máx 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    console.error('❌ Arquivo muito grande:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    return false;
  }

  // Verificar se é um PNG válido (primeiros bytes)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const arrayBuffer = e.target.result;
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Verificar assinatura PNG (89 50 4E 47 0D 0A 1A 0A)
      const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      const isValidPNG = pngSignature.every((byte, index) => uint8Array[index] === byte);
      
      console.log('   - Assinatura PNG válida:', isValidPNG);
      
      if (!isValidPNG) {
        console.error('❌ Arquivo não é um PNG válido');
        resolve(false);
      } else {
        console.log('✅ Arquivo PNG válido');
        resolve(true);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// Função para testar upload com arquivo PNG real
async function testPNGupload() {
  console.log('🧪 Testando upload de arquivo PNG...\n');

  try {
    // 1. Verificar configuração do Supabase
    console.log('1️⃣ Verificando configuração do Supabase...');
    console.log('   - URL:', crmSupabaseUrl);
    console.log('   - Key presente:', crmSupabaseAnonKey ? 'Sim' : 'Não');

    // 2. Verificar bucket
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

    console.log('✅ Bucket qr-codes encontrado:');
    console.log('   - Público:', qrCodesBucket.public);
    console.log('   - Limite de arquivo:', qrCodesBucket.file_size_limit);
    console.log('   - Tipos permitidos:', qrCodesBucket.allowed_mime_types);

    // 3. Verificar se image/png está permitido
    const allowedTypes = qrCodesBucket.allowed_mime_types || [];
    if (!allowedTypes.includes('image/png')) {
      console.error('❌ image/png não está nos tipos permitidos:', allowedTypes);
      console.log('💡 Adicione image/png aos tipos permitidos no Supabase Dashboard');
      return;
    }
    console.log('✅ image/png está permitido');

    // 4. Verificar clientes
    console.log('\n3️⃣ Verificando clientes...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('id, nome')
      .limit(1);

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError.message);
      return;
    }

    if (!clientes || clientes.length === 0) {
      console.error('❌ Nenhum cliente encontrado');
      return;
    }

    const cliente = clientes[0];
    console.log('✅ Cliente encontrado:', cliente.nome);

    // 5. Criar arquivo PNG de teste
    console.log('\n4️⃣ Criando arquivo PNG de teste...');
    
    // PNG válido simples (1x1 pixel transparente)
    const pngData = new Uint8Array([
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
    const testFile = new File([pngData], testFileName, { 
      type: 'image/png',
      lastModified: Date.now()
    });

    // 6. Validar arquivo
    const isValid = await validatePNGFile(testFile);
    if (!isValid) {
      console.error('❌ Arquivo PNG inválido');
      return;
    }

    // 7. Testar upload
    console.log('\n5️⃣ Testando upload...');
    const testFilePath = `cliente-${cliente.id}/${testFileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('qr-codes')
      .upload(testFilePath, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError);
      console.error('   - Status:', uploadError.statusCode);
      console.error('   - Mensagem:', uploadError.message);
      console.error('   - Erro:', uploadError.error);
      return;
    }

    console.log('✅ Upload realizado com sucesso!');
    console.log('   - Path:', uploadData.path);
    console.log('   - ID:', uploadData.id);

    // 8. Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('qr-codes')
      .getPublicUrl(testFilePath);
    console.log('✅ URL pública:', publicUrl);

    // 9. Testar inserção na tabela
    console.log('\n6️⃣ Testando inserção na tabela...');
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
      return;
    }

    console.log('✅ Registro inserido na tabela!');
    console.log('   - ID:', qrCodeData.id);

    // 10. Limpar
    await supabase.storage.from('qr-codes').remove([testFilePath]);
    await supabase.from('whatsapp_qr_codes').delete().eq('id', qrCodeData.id);
    console.log('🧹 Arquivo de teste removido');

    console.log('\n🎉 Teste de upload PNG concluído com sucesso!');
    console.log('\n💡 Se o teste passou, o problema pode estar em:');
    console.log('1. Arquivo PNG específico que você está tentando fazer upload');
    console.log('2. Tamanho do arquivo (máx 5MB)');
    console.log('3. Configuração do frontend');
    console.log('4. Políticas de acesso');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testPNGupload();






