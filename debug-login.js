// Script para debugar o problema de login
import { createClient } from '@supabase/supabase-js'

// Você precisa configurar essas variáveis com os valores corretos do seu Supabase CRM
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'SUA_URL_AQUI'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'SUA_CHAVE_AQUI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugLogin() {
  try {
    console.log('🔍 Debugando problema de login...')
    console.log('📡 URL Supabase:', supabaseUrl)
    console.log('🔑 Chave Supabase configurada:', supabaseKey ? 'SIM' : 'NÃO')
    
    // 1. Testar conexão básica
    console.log('\n1️⃣ Testando conexão com Supabase...')
    const { data: testData, error: testError } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Erro de conexão:', testError)
      console.log('\n🔧 Possíveis soluções:')
      console.log('1. Verifique se as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão corretas')
      console.log('2. Verifique se o projeto Supabase está ativo')
      console.log('3. Verifique se a tabela "usuarios" existe')
      return
    }
    
    console.log('✅ Conexão com Supabase funcionando!')
    
    // 2. Verificar se a coluna password existe
    console.log('\n2️⃣ Verificando estrutura da tabela usuarios...')
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1)
    
    if (usuariosError) {
      console.error('❌ Erro ao acessar tabela usuarios:', usuariosError)
      return
    }
    
    if (usuarios && usuarios.length > 0) {
      const campos = Object.keys(usuarios[0])
      console.log('📋 Campos disponíveis na tabela usuarios:', campos)
      
      if (campos.includes('password')) {
        console.log('✅ Campo "password" encontrado!')
      } else {
        console.log('❌ Campo "password" NÃO encontrado!')
        console.log('🔧 Execute o script SQL: add-password-to-usuarios.sql')
        return
      }
    } else {
      console.log('⚠️ Tabela usuarios está vazia')
    }
    
    // 3. Listar usuários e suas senhas
    console.log('\n3️⃣ Listando usuários e verificando senhas...')
    const { data: allUsuarios, error: allError } = await supabase
      .from('usuarios')
      .select('id, email, nome, role, ativo, password')
    
    if (allError) {
      console.error('❌ Erro ao listar usuários:', allError)
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
      return
    }
    
    // 4. Simular processo de login
    console.log('\n4️⃣ Simulando processo de login...')
    
    // Testar com o primeiro usuário encontrado
    const testUser = allUsuarios[0]
    console.log(`🧪 Testando login com: ${testUser.email}`)
    
    const { data: loginTest, error: loginError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', testUser.email)
      .eq('ativo', true)
      .single()
    
    if (loginError) {
      console.error('❌ Erro no teste de login:', loginError)
    } else if (loginTest) {
      console.log('✅ Usuário encontrado para login!')
      console.log('   Senha armazenada:', loginTest.password ? `"${loginTest.password}"` : 'NULL')
      
      if (!loginTest.password) {
        console.log('❌ PROBLEMA: Usuário não tem senha definida!')
        console.log('🔧 Soluções:')
        console.log('1. Execute o script SQL: add-password-to-usuarios.sql')
        console.log('2. Ou atualize o usuário manualmente no banco')
      }
    } else {
      console.log('❌ Usuário não encontrado para login')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugLogin()
