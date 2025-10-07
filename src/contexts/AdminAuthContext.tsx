import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabaseCrm } from '@/lib/supabase-crm.js'

interface AdminUser {
  id: string;
  username: string;
  email: string;
  nome: string;
  ativo: boolean;
  created_at: string;
  last_login?: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  adminSignIn: (username: string, password: string) => Promise<void>;
  adminSignOut: () => Promise<void>;
  isAdmin: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há admin salvo no localStorage
    const savedAdmin = localStorage.getItem('kommuchat_admin')
    
    if (savedAdmin) {
      try {
        const adminData = JSON.parse(savedAdmin)
        setAdminUser(adminData)
      } catch (error) {
        console.log('❌ Erro ao carregar admin do localStorage:', error)
        localStorage.removeItem('kommuchat_admin')
      }
    }
    
    setLoading(false)
  }, [])

  const adminSignIn = async (username: string, password: string) => {
    try {
      console.log('🔍 AdminAuth - Iniciando processo de login...');
      console.log('🔍 AdminAuth - Username:', username);
      console.log('🔍 AdminAuth - SupabaseCrm disponível:', !!supabaseCrm);
      
      if (!supabaseCrm) {
        console.error('❌ AdminAuth - Supabase CRM client não está inicializado');
        throw new Error('Supabase CRM client não está inicializado');
      }

      console.log('🔍 AdminAuth - Tentativa de login:', username);

      // Buscar usuário admin por username
      console.log('🔍 AdminAuth - Buscando usuário admin...');
      const { data: adminData, error: fetchError } = await supabaseCrm
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('ativo', true)
        .single();

      console.log('🔍 AdminAuth - Resultado da busca:', { adminData, fetchError });

      if (fetchError) {
        console.error('❌ AdminAuth - Erro ao buscar usuário:', fetchError);
        if (fetchError.code === 'PGRST116') {
          throw new Error('Usuário admin não encontrado');
        }
        throw fetchError;
      }

      if (!adminData) {
        throw new Error('Usuário admin não encontrado');
      }

      // Verificar se a conta está bloqueada
      if (adminData.locked_until && new Date(adminData.locked_until) > new Date()) {
        const lockTime = new Date(adminData.locked_until).toLocaleString('pt-BR');
        throw new Error(`Conta bloqueada até ${lockTime} devido a múltiplas tentativas de login`);
      }

      // Verificar a senha usando bcrypt
      console.log('🔍 AdminAuth - Verificando senha...');
      const { data: passwordValid, error: passwordError } = await supabaseCrm
        .rpc('verify_admin_password', { 
          password_param: password, 
          hash_param: adminData.password_hash 
        });

      console.log('🔍 AdminAuth - Resultado da verificação:', { passwordValid, passwordError });

      if (passwordError) {
        console.error('❌ AdminAuth - Erro na verificação de senha:', passwordError);
        throw new Error(`Erro na verificação de senha: ${passwordError.message}`);
      }

      if (!passwordValid) {
        console.log('❌ AdminAuth - Senha incorreta, incrementando tentativas...');
        // Incrementar tentativas de login
        await supabaseCrm.rpc('increment_admin_login_attempts', { username_param: username });
        throw new Error('Senha incorreta');
      }

      // Login bem-sucedido - resetar tentativas e atualizar last_login
      await supabaseCrm.rpc('reset_admin_login_attempts', { username_param: username });

      console.log('✅ AdminAuth - Login realizado com sucesso:', adminData.username);

      // Preparar dados do admin para o contexto
      const adminUser: AdminUser = {
        id: adminData.id,
        username: adminData.username,
        email: adminData.email,
        nome: adminData.nome,
        ativo: adminData.ativo,
        created_at: adminData.created_at,
        last_login: new Date().toISOString()
      };

      // Salvar no localStorage para persistir o login
      localStorage.setItem('kommuchat_admin', JSON.stringify(adminUser));
      setAdminUser(adminUser);
      
    } catch (error) {
      console.error('❌ AdminAuth - Erro no login:', error);
      throw error;
    }
  }

  const adminSignOut = async () => {
    localStorage.removeItem('kommuchat_admin')
    setAdminUser(null)
  }

  const isAdmin = adminUser !== null && adminUser.ativo

  return (
    <AdminAuthContext.Provider value={{
      adminUser,
      loading,
      adminSignIn,
      adminSignOut,
      isAdmin,
    }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth deve ser usado dentro de um AdminAuthProvider')
  }
  return context
}
