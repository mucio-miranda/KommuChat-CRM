// Script simples para testar conexão com Supabase
import { createClient } from '@supabase/supabase-js'

// Substitua pelos valores corretos do seu projeto Supabase CRM
const SUPABASE_URL = 'https://seu-projeto.supabase.co' // Substitua pela URL real
const SUPABASE_ANON_KEY = 'sua-chave-anonima' // Substitua pela chave real

console.log('🔍 Testando conexão com Supabase...')
console.log('URL:', SUPABASE_URL)
console.log('Chave configurada:', SUPABASE_ANON_KEY ? 'SIM' : 'NÃO')

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testConnection() {
  try {
    // Teste básico de conexão
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro:', error.message)
      console.log('💡 Verifique:')
      console.log('1. Se a URL está correta')
      console.log('2. Se a chave anônima está correta')
      console.log('3. Se o projeto Supabase está ativo')
      console.log('4. Se a tabela "usuarios" existe')
      return
    }
    
    console.log('✅ Conexão funcionando!')
    console.log('📊 Dados encontrados:', data?.length || 0, 'registros')
    
    if (data && data.length > 0) {
      console.log('📋 Estrutura do primeiro registro:')
      console.log(Object.keys(data[0]))
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

testConnection()
