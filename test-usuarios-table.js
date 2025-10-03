// Script para testar a tabela usuarios e verificar se a coluna password existe
import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase CRM (substitua pelos seus valores)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'SUA_URL_AQUI'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'SUA_CHAVE_AQUI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUsuariosTable() {
  try {
    console.log('🔍 Testando tabela usuarios...')
    
    // 1. Verificar estrutura da tabela
    console.log('\n📋 Verificando estrutura da tabela usuarios:')
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro ao acessar tabela usuarios:', error)
      return
    }
    
    if (usuarios && usuarios.length > 0) {
      console.log('✅ Estrutura da tabela usuarios:')
      console.log('Campos disponíveis:', Object.keys(usuarios[0]))
      
      // Verificar se tem campo password
      if ('password' in usuarios[0]) {
        console.log('✅ Campo "password" encontrado!')
        console.log('Exemplo de senha:', usuarios[0].password ? '***' : 'NULL')
      } else {
        console.log('❌ Campo "password" NÃO encontrado!')
        console.log('⚠️ Execute o script SQL add-password-to-usuarios.sql')
      }
    } else {
      console.log('⚠️ Tabela usuarios está vazia')
    }
    
    // 2. Listar todos os usuários
    console.log('\n👥 Listando todos os usuários:')
    const { data: allUsuarios, error: allError } = await supabase
      .from('usuarios')
      .select('id, email, nome, role, ativo, password')
    
    if (allError) {
      console.error('❌ Erro ao listar usuários:', allError)
      return
    }
    
    if (allUsuarios && allUsuarios.length > 0) {
      allUsuarios.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.nome} (${user.email})`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Ativo: ${user.ativo}`)
        console.log(`   Senha: ${user.password ? '***' : 'NULL'}`)
      })
    } else {
      console.log('❌ Nenhum usuário encontrado na tabela')
    }
    
    // 3. Testar busca por email específico
    console.log('\n🔍 Testando busca por email:')
    const testEmail = 'admin@kommuchat.com' // Substitua por um email que você sabe que existe
    
    const { data: specificUser, error: specificError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', testEmail)
      .single()
    
    if (specificError) {
      console.log(`❌ Erro ao buscar usuário ${testEmail}:`, specificError.message)
    } else if (specificUser) {
      console.log(`✅ Usuário ${testEmail} encontrado:`)
      console.log('   Nome:', specificUser.nome)
      console.log('   Senha:', specificUser.password ? '***' : 'NULL')
    } else {
      console.log(`❌ Usuário ${testEmail} não encontrado`)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testUsuariosTable()
