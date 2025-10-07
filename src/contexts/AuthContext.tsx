import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, Usuario } from '@/lib/supabase.js'
import { supabaseCrm } from '@/lib/supabase-crm.js'

interface AuthContextType {
  user: Usuario | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
  isFuncionario: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sistema de autenticação simplificado - SEM MODO VISITANTE
    console.log('🔍 AuthContext - Inicializando sistema de autenticação personalizado')
    
    // Verificar se há usuário salvo no localStorage
    const savedUser = localStorage.getItem('kommuchat_user')
    
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser)
          console.log('✅ AuthContext - Usuário encontrado no localStorage:', userData)
          setUser(userData)
        } catch (error) {
          console.log('❌ AuthContext - Erro ao carregar usuário do localStorage:', error)
          setUser(null)
        }
      } else {
        console.log('❌ AuthContext - Nenhum usuário encontrado - necessário fazer login')
        setUser(null)
      }
    
    setLoading(false)
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      if (!supabaseCrm) {
        setUser(null)
        return
      }

      const { data, error } = await supabaseCrm
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUser(data)
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error)
      setUser(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      if (!supabaseCrm) {
        // Se não há Supabase CRM configurado, não é possível fazer login
        throw new Error('Supabase CRM client não está inicializado para login.');
      }

      // Buscar usuário por email OU username
      const { data: userData, error } = await supabaseCrm
        .from('usuarios')
        .select('*')
        .or(`email.eq.${email},username.eq.${email}`)
        .eq('ativo', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Usuário não encontrado')
        }
        throw error
      }

      if (!userData) {
        throw new Error('Usuário não encontrado')
      }

      // Verificar a senha usando a função SQL
      const { data: passwordValid, error: passwordError } = await supabaseCrm
        .rpc('verify_password', { 
          password_param: password, 
          hash_param: userData.password 
        });

      if (passwordError || !passwordValid) {
        throw new Error('Senha incorreta')
      }
      
      console.log('✅ Login realizado com sucesso:', userData)
      
        // Salvar no localStorage para persistir o login
        localStorage.setItem('kommuchat_user', JSON.stringify(userData))
        
        setUser(userData)
      
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    }
  }


  const signOut = async () => {
    try {
      // Sistema de logout simplificado (sem Supabase Auth)
      localStorage.removeItem('kommuchat_user')
      
      // NÃO limpar cache do Google Calendar para manter conexão entre logins
      // localStorage.removeItem('google_calendar_tokens') // REMOVIDO
      // localStorage.removeItem('google_code_verifier') // REMOVIDO
      
      setUser(null)
      console.log('✅ Logout realizado com sucesso - Google Calendar mantido conectado')
    } catch (error) {
      console.error('Erro no logout:', error)
      throw error
    }
  }

  const isAdmin = user?.role === 'admin'
  const isFuncionario = user?.role === 'funcionario'

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signOut,
      isAdmin,
      isFuncionario,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
