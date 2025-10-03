// Script para criar o bucket qr-codes imediatamente
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const crmSupabaseUrl = process.env.VITE_CRM_SUPABASE_URL;
const crmSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Precisa da chave de serviço

if (!crmSupabaseUrl || !crmSupabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas:');
  console.error('VITE_CRM_SUPABASE_URL:', crmSupabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', crmSupabaseServiceKey ? '✅' : '❌');
  console.log('\n💡 Para obter a SERVICE_ROLE_KEY:');
  console.log('1. Acesse Supabase Dashboard > Settings > API');
  console.log('2. Copie a "service_role" key (não a anon key)');
  console.log('3. Adicione no seu .env: SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui');
  process.exit(1);
}

// Criar cliente com chave de serviço para operações administrativas
const supabase = createClient(crmSupabaseUrl, crmSupabaseServiceKey);

async function createBucketNow() {
  try {
    console.log('🚀 Criando bucket qr-codes...');

    // 1. Verificar se já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError.message);
      return;
    }

    const existingBucket = buckets.find(bucket => bucket.id === 'qr-codes');
    if (existingBucket) {
      console.log('✅ Bucket qr-codes já existe!');
      console.log('   - Público:', existingBucket.public);
      console.log('   - Limite:', existingBucket.file_size_limit);
      console.log('   - Tipos permitidos:', existingBucket.allowed_mime_types);
      return;
    }

    // 2. Criar o bucket
    const { data: bucketData, error: createError } = await supabase.storage.createBucket('qr-codes', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    });

    if (createError) {
      console.error('❌ Erro ao criar bucket:', createError.message);
      console.error('   - Código:', createError.statusCode);
      console.error('   - Detalhes:', createError.error);
      return;
    }

    console.log('✅ Bucket qr-codes criado com sucesso!');
    console.log('   - ID:', bucketData.id);
    console.log('   - Público:', bucketData.public);
    console.log('   - Limite de arquivo:', bucketData.file_size_limit);
    console.log('   - Tipos permitidos:', bucketData.allowed_mime_types);

    // 3. Testar upload
    console.log('\n🧪 Testando upload...');
    const testContent = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testFile = new File([testContent], 'test.png', { type: 'image/png' });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('qr-codes')
      .upload('test/test.png', testFile);

    if (uploadError) {
      console.error('❌ Erro no teste de upload:', uploadError.message);
    } else {
      console.log('✅ Teste de upload bem-sucedido!');
      
      // Limpar arquivo de teste
      await supabase.storage
        .from('qr-codes')
        .remove(['test/test.png']);
      console.log('🧹 Arquivo de teste removido');
    }

    console.log('\n🎉 Bucket qr-codes configurado e funcionando!');
    console.log('💡 Agora você pode fazer upload de QR codes PNG no sistema.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar criação
createBucketNow();


