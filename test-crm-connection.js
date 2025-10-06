// Script para testar conexão com o projeto CRM Supabase
import { createClient } from '@supabase/supabase-js'

// Configurações do projeto CRM (do arquivo .env)
const CRM_SUPABASE_URL = process.env.VITE_CRM_SUPABASE_URL || 'https://your-crm-project.supabase.co'
const CRM_SUPABASE_ANON_KEY = process.env.VITE_CRM_SUPABASE_ANON_KEY || 'your_crm_supabase_anon_key_here'

// Verificar se as credenciais estão configuradas
if (!process.env.VITE_CRM_SUPABASE_URL || !process.env.VITE_CRM_SUPABASE_ANON_KEY) {
  console.error('❌ ERRO: Variáveis de ambiente não configuradas!')
  console.log('📝 Configure as seguintes variáveis no arquivo .env:')
  console.log('   VITE_CRM_SUPABASE_URL=https://your-crm-project.supabase.co')
  console.log('   VITE_CRM_SUPABASE_ANON_KEY=your_crm_supabase_anon_key_here')
  console.log('')
  console.log('🔧 Copie o arquivo env.example para .env e configure suas credenciais reais')
  process.exit(1)
}

console.log('🔍 Testando conexão com projeto CRM Supabase...')
console.log('URL:', CRM_SUPABASE_URL)

const supabase = createClient(CRM_SUPABASE_URL, CRM_SUPABASE_ANON_KEY)

async function testCrmConnection() {
  try {
    console.log('\n1️⃣ Testando conexão básica...')
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro de conexão:', error.message)
      console.log('\n🔧 Possíveis soluções:')
      console.log('1. Verifique se o projeto CRM está ativo')
      console.log('2. Verifique se a tabela "usuarios" existe')
      console.log('3. Verifique se as credenciais estão corretas')
      return
    }
    
    console.log('✅ Conexão com projeto CRM funcionando!')
    
    // 2. Verificar estrutura da tabela usuarios
    console.log('\n2️⃣ Verificando estrutura da tabela usuarios...')
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1)
    
    if (usuariosError) {
      console.error('❌ Erro ao acessar tabela usuarios:', usuariosError.message)
      return
    }
    
    if (usuarios && usuarios.length > 0) {
      const campos = Object.keys(usuarios[0])
      console.log('📋 Campos disponíveis na tabela usuarios:', campos)
      
      if (campos.includes('password')) {
        console.log('✅ Campo "password" encontrado!')
      } else {
        console.log('❌ Campo "password" NÃO encontrado!')
        console.log('🔧 Execute o script SQL no projeto CRM: add-password-to-usuarios.sql')
        return
      }
    } else {
      console.log('⚠️ Tabela usuarios está vazia')
    }
    
    // 3. Listar todos os usuários
    console.log('\n3️⃣ Listando todos os usuários...')
    const { data: allUsuarios, error: allError } = await supabase
      .from('usuarios')
      .select('id, email, nome, role, ativo, password')
    
    if (allError) {
      console.error('❌ Erro ao listar usuários:', allError.message)
      return
    }
    
    if (allUsuarios && allUsuarios.length > 0) {
      console.log(`📊 Total de usuários: ${allUsuarios.length}`)
      allUsuarios.forEach((user, index) => {
        console.log(`\n👤 Usuário ${index + 1}:`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Nome: ${user.nome}`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Ativo: ${user.ativo}`)
        console.log(`   Senha: ${user.password ? `"${user.password}"` : 'NULL'}`)
      })
    } else {
      console.log('❌ Nenhum usuário encontrado')
      console.log('🔧 Crie um usuário através do gerenciador em /admin/dashboard')
    }
    
    // 4. Testar busca específica (simular login)
    console.log('\n4️⃣ Testando busca para login...')
    
    if (allUsuarios && allUsuarios.length > 0) {
      const testUser = allUsuarios[0]
      console.log(`🧪 Testando busca para login com: ${testUser.email}`)
      
      const { data: loginUser, error: loginError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', testUser.email)
        .eq('ativo', true)
        .single()
      
      if (loginError) {
        console.error('❌ Erro no teste de login:', loginError.message)
      } else if (loginUser) {
        console.log('✅ Usuário encontrado para login!')
        console.log('   Senha armazenada:', loginUser.password ? `"${loginUser.password}"` : 'NULL')
        
        if (!loginUser.password) {
          console.log('❌ PROBLEMA: Usuário não tem senha definida!')
          console.log('🔧 Execute o script SQL no projeto CRM: add-password-to-usuarios.sql')
        } else {
          console.log('✅ Usuário pronto para login!')
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

testCrmConnection()
