// Script para testar e criar tabelas no Supabase CRM
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase CRM...');
  
  try {
    // Testar conexão básica
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
      return false;
    }
    
    console.log('✅ Conexão com Supabase CRM funcionando!');
    return true;
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

async function checkTables() {
  console.log('🔍 Verificando tabelas existentes...');
  
  const tables = ['google_credentials', 'google_calendar_tokens'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ Tabela ${table} não existe`);
        } else {
          console.error(`❌ Erro ao verificar tabela ${table}:`, error);
        }
      } else {
        console.log(`✅ Tabela ${table} existe`);
      }
    } catch (error) {
      console.error(`❌ Erro ao verificar tabela ${table}:`, error);
    }
  }
}

async function createTables() {
  console.log('🔧 Criando tabelas necessárias...');
  
  const createGoogleCredentials = `
    CREATE TABLE IF NOT EXISTS google_credentials (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      cliente_id UUID NOT NULL,
      client_id TEXT NOT NULL,
      client_secret TEXT NOT NULL,
      redirect_uri TEXT NOT NULL,
      calendar_id TEXT,
      configured BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(cliente_id)
    );
  `;
  
  const createGoogleTokens = `
    CREATE TABLE IF NOT EXISTS google_calendar_tokens (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      token_type TEXT DEFAULT 'Bearer',
      expires_in INTEGER,
      scope TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id)
    );
  `;
  
  try {
    // Criar tabelas usando rpc (se disponível) ou SQL direto
    console.log('📝 Executando criação de tabelas...');
    console.log('⚠️ Execute manualmente o script SQL no Supabase Dashboard');
    console.log('🔗 URL: https://wywzdtyjzzmcehrsalvn.supabase.co');
    console.log('📋 SQL:');
    console.log(createGoogleCredentials);
    console.log(createGoogleTokens);
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  }
}

async function main() {
  console.log('🚀 Iniciando teste do Supabase CRM...');
  
  const connected = await testSupabaseConnection();
  if (!connected) {
    console.log('❌ Não foi possível conectar ao Supabase CRM');
    return;
  }
  
  await checkTables();
  await createTables();
  
  console.log('✅ Teste concluído!');
  console.log('📋 Próximos passos:');
  console.log('1. Execute o script SQL no Supabase Dashboard');
  console.log('2. Teste a conexão do Google Calendar');
  console.log('3. Atualize o Google Cloud Console com a porta 8081');
}

main().catch(console.error);
