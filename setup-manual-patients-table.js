import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_CRM_SUPABASE_URL;
const supabaseKey = process.env.VITE_CRM_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createManualPatientsTable() {
  try {
    console.log('🚀 Criando tabela de pacientes manuais...');
    
    const sql = `
      -- Criar tabela para pacientes adicionados manualmente
      CREATE TABLE IF NOT EXISTS pacientes_manuais (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          telefone VARCHAR(20),
          status VARCHAR(50) DEFAULT 'novo',
          observacoes TEXT,
          cliente_id UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Habilitar RLS (Row Level Security)
      ALTER TABLE pacientes_manuais ENABLE ROW LEVEL SECURITY;

      -- Política para permitir que usuários vejam apenas seus próprios pacientes
      CREATE POLICY "Users can view their own manual patients" ON pacientes_manuais
          FOR SELECT USING (auth.uid() = cliente_id);

      -- Política para permitir que usuários insiram seus próprios pacientes
      CREATE POLICY "Users can insert their own manual patients" ON pacientes_manuais
          FOR INSERT WITH CHECK (auth.uid() = cliente_id);

      -- Política para permitir que usuários atualizem seus próprios pacientes
      CREATE POLICY "Users can update their own manual patients" ON pacientes_manuais
          FOR UPDATE USING (auth.uid() = cliente_id);

      -- Política para permitir que usuários deletem seus próprios pacientes
      CREATE POLICY "Users can delete their own manual patients" ON pacientes_manuais
          FOR DELETE USING (auth.uid() = cliente_id);

      -- Criar função para atualizar updated_at automaticamente
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Criar trigger para atualizar updated_at automaticamente
      CREATE TRIGGER update_pacientes_manuais_updated_at 
          BEFORE UPDATE ON pacientes_manuais 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();

      -- Criar índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_pacientes_manuais_cliente_id ON pacientes_manuais(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_pacientes_manuais_status ON pacientes_manuais(status);
      CREATE INDEX IF NOT EXISTS idx_pacientes_manuais_created_at ON pacientes_manuais(created_at);
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Erro ao criar tabela:', error);
      return false;
    }

    console.log('✅ Tabela de pacientes manuais criada com sucesso!');
    console.log('📋 Recursos implementados:');
    console.log('   - Tabela pacientes_manuais');
    console.log('   - Row Level Security (RLS)');
    console.log('   - Políticas de acesso por usuário');
    console.log('   - Trigger para updated_at automático');
    console.log('   - Índices para performance');
    
    return true;

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return false;
  }
}

// Executar se chamado diretamente
createManualPatientsTable()
  .then(success => {
    if (success) {
      console.log('🎉 Setup concluído com sucesso!');
    } else {
      console.log('💥 Setup falhou');
      process.exit(1);
    }
  });

export { createManualPatientsTable };
