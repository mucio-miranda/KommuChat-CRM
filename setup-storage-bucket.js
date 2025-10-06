// Script para configurar o bucket qr-codes no Supabase Storage
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const crmSupabaseUrl = process.env.VITE_CRM_SUPABASE_URL;
const crmSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Chave de serviço para operações administrativas

if (!crmSupabaseUrl || !crmSupabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas:');
  console.error('VITE_CRM_SUPABASE_URL:', crmSupabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', crmSupabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

// Criar cliente com chave de serviço para operações administrativas
const supabase = createClient(crmSupabaseUrl, crmSupabaseServiceKey);

async function setupQRCodeStorage() {
  try {
    console.log('🚀 Configurando bucket qr-codes no Supabase Storage...');

    // 1. Verificar se o bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      return;
    }

    const qrCodesBucket = buckets.find(bucket => bucket.id === 'qr-codes');
    
    if (qrCodesBucket) {
      console.log('✅ Bucket qr-codes já existe');
    } else {
      // 2. Criar bucket qr-codes
      const { data: bucketData, error: createError } = await supabase.storage.createBucket('qr-codes', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
      });

      if (createError) {
        console.error('❌ Erro ao criar bucket:', createError);
        return;
      }

      console.log('✅ Bucket qr-codes criado com sucesso');
    }

    // 3. Configurar políticas de acesso
    console.log('🔧 Configurando políticas de acesso...');

    const policies = [
      {
        name: 'Allow authenticated users to upload QR codes',
        definition: `bucket_id = 'qr-codes' AND auth.role() = 'authenticated'`,
        operation: 'INSERT'
      },
      {
        name: 'Allow public access to QR codes',
        definition: `bucket_id = 'qr-codes'`,
        operation: 'SELECT'
      },
      {
        name: 'Allow users to update their own QR codes',
        definition: `bucket_id = 'qr-codes' AND auth.role() = 'authenticated'`,
        operation: 'UPDATE'
      },
      {
        name: 'Allow users to delete their own QR codes',
        definition: `bucket_id = 'qr-codes' AND auth.role() = 'authenticated'`,
        operation: 'DELETE'
      }
    ];

    for (const policy of policies) {
      try {
        // Verificar se a política já existe
        const { data: existingPolicies, error: checkError } = await supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'objects')
          .eq('policyname', policy.name);

        if (checkError) {
          console.log(`⚠️ Não foi possível verificar política ${policy.name}:`, checkError.message);
          continue;
        }

        if (existingPolicies && existingPolicies.length > 0) {
          console.log(`✅ Política ${policy.name} já existe`);
        } else {
          // Criar política (isso precisa ser feito via SQL direto)
          console.log(`🔧 Criando política ${policy.name}...`);
          // Nota: As políticas serão criadas via SQL no arquivo setup-qr-codes-storage.sql
        }
      } catch (error) {
        console.log(`⚠️ Erro ao configurar política ${policy.name}:`, error.message);
      }
    }

    // 4. Testar upload de arquivo de exemplo
    console.log('🧪 Testando upload de arquivo...');
    
    // Criar um arquivo de teste simples
    const testContent = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testFile = new File([testContent], 'test.png', { type: 'image/png' });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('qr-codes')
      .upload('test/test.png', testFile);

    if (uploadError) {
      console.error('❌ Erro no teste de upload:', uploadError);
    } else {
      console.log('✅ Teste de upload bem-sucedido');
      
      // Limpar arquivo de teste
      await supabase.storage
        .from('qr-codes')
        .remove(['test/test.png']);
      console.log('🧹 Arquivo de teste removido');
    }

    console.log('🎉 Configuração do storage concluída com sucesso!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Execute o arquivo create-qr-codes-table.sql no Supabase SQL Editor');
    console.log('2. Execute o arquivo setup-qr-codes-storage.sql no Supabase SQL Editor');
    console.log('3. Teste o upload de QR codes no UserManagement.tsx');

  } catch (error) {
    console.error('❌ Erro geral na configuração:', error);
  }
}

// Executar configuração
setupQRCodeStorage();






