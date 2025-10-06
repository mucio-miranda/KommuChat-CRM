// Script para verificar configuração do bucket qr-codes
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

async function checkBucketConfig() {
  console.log('🔍 Verificando configuração do bucket qr-codes...\n');

  try {
    // 1. Listar todos os buckets
    console.log('1️⃣ Listando todos os buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError.message);
      return;
    }

    console.log('📦 Buckets encontrados:');
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.id}:`);
      console.log(`     * Público: ${bucket.public}`);
      console.log(`     * Limite de arquivo: ${bucket.file_size_limit || 'Não definido'}`);
      console.log(`     * Tipos permitidos: ${bucket.allowed_mime_types?.join(', ') || 'Todos'}`);
      console.log(`     * Criado em: ${bucket.created_at}`);
    });

    // 2. Verificar bucket qr-codes especificamente
    console.log('\n2️⃣ Verificando bucket qr-codes...');
    const qrCodesBucket = buckets.find(bucket => bucket.id === 'qr-codes');
    
    if (!qrCodesBucket) {
      console.error('❌ Bucket qr-codes não encontrado!');
      console.log('\n💡 Para criar o bucket:');
      console.log('1. Acesse o Supabase Dashboard');
      console.log('2. Vá em Storage');
      console.log('3. Clique em "New bucket"');
      console.log('4. Nome: qr-codes');
      console.log('5. Marque como "Public"');
      console.log('6. File size limit: 5242880 (5MB)');
      console.log('7. Allowed MIME types: image/png, image/jpeg, image/jpg, image/gif, image/webp');
      return;
    }

    console.log('✅ Bucket qr-codes encontrado:');
    console.log(`   - Público: ${qrCodesBucket.public}`);
    console.log(`   - Limite de arquivo: ${qrCodesBucket.file_size_limit || 'Não definido'}`);
    console.log(`   - Tipos permitidos: ${qrCodesBucket.allowed_mime_types?.join(', ') || 'Todos'}`);

    // 3. Verificar se está público
    if (!qrCodesBucket.public) {
      console.warn('⚠️ Bucket não está público! Isso pode causar problemas de acesso.');
      console.log('💡 Torne o bucket público no Supabase Dashboard > Storage > qr-codes > Settings');
    }

    // 4. Verificar limite de arquivo
    if (!qrCodesBucket.file_size_limit) {
      console.warn('⚠️ Limite de arquivo não definido!');
    } else if (qrCodesBucket.file_size_limit < 5242880) {
      console.warn(`⚠️ Limite de arquivo muito baixo: ${qrCodesBucket.file_size_limit} bytes (recomendado: 5242880 bytes)`);
    }

    // 5. Verificar tipos MIME permitidos
    const allowedTypes = qrCodesBucket.allowed_mime_types || [];
    const requiredTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    
    console.log('\n3️⃣ Verificando tipos MIME permitidos...');
    requiredTypes.forEach(type => {
      if (allowedTypes.includes(type)) {
        console.log(`   ✅ ${type} permitido`);
      } else {
        console.log(`   ❌ ${type} NÃO permitido`);
      }
    });

    if (allowedTypes.length === 0) {
      console.log('ℹ️ Nenhum tipo MIME restrito (todos permitidos)');
    }

    // 6. Verificar políticas de acesso
    console.log('\n4️⃣ Verificando políticas de acesso...');
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'objects')
        .like('policyname', '%qr-codes%');

      if (policiesError) {
        console.log('⚠️ Não foi possível verificar políticas:', policiesError.message);
      } else if (policies && policies.length > 0) {
        console.log('✅ Políticas encontradas:');
        policies.forEach(policy => {
          console.log(`   - ${policy.policyname}: ${policy.cmd}`);
        });
      } else {
        console.log('⚠️ Nenhuma política específica para qr-codes encontrada');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar políticas:', error.message);
    }

    // 7. Testar acesso ao bucket
    console.log('\n5️⃣ Testando acesso ao bucket...');
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('qr-codes')
        .list('', { limit: 1 });

      if (listError) {
        console.error('❌ Erro ao listar arquivos:', listError.message);
      } else {
        console.log('✅ Acesso ao bucket funcionando');
        console.log(`   - Arquivos encontrados: ${files?.length || 0}`);
      }
    } catch (error) {
      console.error('❌ Erro ao testar acesso:', error.message);
    }

    // 8. Resumo e recomendações
    console.log('\n📋 Resumo da configuração:');
    
    const issues = [];
    if (!qrCodesBucket.public) issues.push('Bucket não está público');
    if (!qrCodesBucket.file_size_limit || qrCodesBucket.file_size_limit < 5242880) {
      issues.push('Limite de arquivo inadequado');
    }
    if (allowedTypes.length > 0 && !allowedTypes.includes('image/png')) {
      issues.push('image/png não permitido');
    }

    if (issues.length === 0) {
      console.log('✅ Configuração do bucket está correta!');
    } else {
      console.log('⚠️ Problemas encontrados:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      
      console.log('\n🔧 Para corrigir:');
      console.log('1. Acesse Supabase Dashboard > Storage > qr-codes');
      console.log('2. Clique em "Settings"');
      console.log('3. Configure:');
      console.log('   - Public: Sim');
      console.log('   - File size limit: 5242880');
      console.log('   - Allowed MIME types: image/png, image/jpeg, image/jpg, image/gif, image/webp');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
checkBucketConfig();






