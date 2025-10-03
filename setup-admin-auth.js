const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase CRM
const supabaseUrl = process.env.VITE_SUPABASE_CRM_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_CRM_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase CRM não configuradas');
  console.error('Necessário: VITE_SUPABASE_CRM_URL e VITE_SUPABASE_CRM_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdminAuth() {
  console.log('🔧 Configurando sistema de autenticação administrativa...');

  try {
    // 1. Criar tabela admin_users
    console.log('📋 Criando tabela admin_users...');
    
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Tabela para armazenar credenciais da equipe técnica da KOMMUchat
        CREATE TABLE IF NOT EXISTS admin_users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          nome VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          ativo BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_login TIMESTAMP WITH TIME ZONE,
          login_attempts INTEGER DEFAULT 0,
          locked_until TIMESTAMP WITH TIME ZONE
        );
      `
    });

    if (createTableError) {
      console.error('❌ Erro ao criar tabela admin_users:', createTableError);
      throw createTableError;
    }

    // 2. Criar índices
    console.log('📊 Criando índices...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);',
      'CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);',
      'CREATE INDEX IF NOT EXISTS idx_admin_users_ativo ON admin_users(ativo);'
    ];

    for (const indexSql of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSql });
      if (indexError) {
        console.error('❌ Erro ao criar índice:', indexError);
        throw indexError;
      }
    }

    // 3. Criar funções
    console.log('🔧 Criando funções de segurança...');
    
    const functions = [
      {
        name: 'update_admin_users_updated_at',
        sql: `
          CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `
      },
      {
        name: 'hash_admin_password',
        sql: `
          CREATE OR REPLACE FUNCTION hash_admin_password(password_param TEXT)
          RETURNS TEXT AS $$
          BEGIN
            RETURN crypt(password_param, gen_salt('bf', 12));
          END;
          $$ LANGUAGE plpgsql;
        `
      },
      {
        name: 'verify_admin_password',
        sql: `
          CREATE OR REPLACE FUNCTION verify_admin_password(password_param TEXT, hash_param TEXT)
          RETURNS BOOLEAN AS $$
          BEGIN
            RETURN crypt(password_param, hash_param) = hash_param;
          END;
          $$ LANGUAGE plpgsql;
        `
      },
      {
        name: 'increment_admin_login_attempts',
        sql: `
          CREATE OR REPLACE FUNCTION increment_admin_login_attempts(username_param TEXT)
          RETURNS VOID AS $$
          BEGIN
            UPDATE admin_users 
            SET login_attempts = login_attempts + 1,
                locked_until = CASE 
                  WHEN login_attempts >= 4 THEN NOW() + INTERVAL '15 minutes'
                  ELSE locked_until
                END
            WHERE username = username_param;
          END;
          $$ LANGUAGE plpgsql;
        `
      },
      {
        name: 'reset_admin_login_attempts',
        sql: `
          CREATE OR REPLACE FUNCTION reset_admin_login_attempts(username_param TEXT)
          RETURNS VOID AS $$
          BEGIN
            UPDATE admin_users 
            SET login_attempts = 0,
                locked_until = NULL,
                last_login = NOW()
            WHERE username = username_param;
          END;
          $$ LANGUAGE plpgsql;
        `
      }
    ];

    for (const func of functions) {
      const { error: funcError } = await supabase.rpc('exec_sql', { sql: func.sql });
      if (funcError) {
        console.error(`❌ Erro ao criar função ${func.name}:`, funcError);
        throw funcError;
      }
    }

    // 4. Criar trigger
    console.log('⚡ Criando trigger...');
    
    const triggerSql = `
      DROP TRIGGER IF EXISTS trigger_update_admin_users_updated_at ON admin_users;
      CREATE TRIGGER trigger_update_admin_users_updated_at
        BEFORE UPDATE ON admin_users
        FOR EACH ROW
        EXECUTE FUNCTION update_admin_users_updated_at();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSql });
    if (triggerError) {
      console.error('❌ Erro ao criar trigger:', triggerError);
      throw triggerError;
    }

    // 5. Inserir usuário admin padrão
    console.log('👤 Criando usuário admin padrão...');
    
    const adminPassword = "I'g6kvTzWeE{,b.qPZ7)+B_}qZ6;08[BAKc]>tH=84.O.$w,79";
    
    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO admin_users (username, password_hash, nome, email) 
        VALUES (
          'kommuchat.admin',
          hash_admin_password('${adminPassword}'),
          'Administrador KOMMUchat',
          'admin@kommuchat.com'
        ) ON CONFLICT (username) DO NOTHING;
      `
    });

    if (insertError) {
      console.error('❌ Erro ao inserir usuário admin:', insertError);
      throw insertError;
    }

    // 6. Configurar RLS
    console.log('🔒 Configurando Row Level Security...');
    
    const rlsSql = `
      ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS admin_users_select_policy ON admin_users;
      CREATE POLICY admin_users_select_policy ON admin_users
        FOR SELECT
        USING (true);
      
      DROP POLICY IF EXISTS admin_users_insert_policy ON admin_users;
      CREATE POLICY admin_users_insert_policy ON admin_users
        FOR INSERT
        WITH CHECK (false);
      
      DROP POLICY IF EXISTS admin_users_update_policy ON admin_users;
      CREATE POLICY admin_users_update_policy ON admin_users
        FOR UPDATE
        USING (false);
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSql });
    if (rlsError) {
      console.error('❌ Erro ao configurar RLS:', rlsError);
      throw rlsError;
    }

    console.log('✅ Sistema de autenticação administrativa configurado com sucesso!');
    console.log('');
    console.log('📋 Credenciais do administrador:');
    console.log('   Username: kommuchat.admin');
    console.log('   Senha: [Configurada com hash bcrypt]');
    console.log('');
    console.log('🔒 Recursos de segurança implementados:');
    console.log('   - Hash bcrypt com salt rounds 12');
    console.log('   - Bloqueio após 5 tentativas de login');
    console.log('   - Row Level Security ativado');
    console.log('   - Triggers automáticos');
    console.log('   - Logs de tentativas de login');

  } catch (error) {
    console.error('❌ Erro geral na configuração:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupAdminAuth();
}

module.exports = { setupAdminAuth };
