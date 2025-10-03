import { supabase } from './supabase';

export interface TableCreationResult {
  success: boolean;
  tablesCreated: string[];
  errors: string[];
}

export class SupabaseTableCreator {
  /**
   * Cria tabelas específicas para um cliente
   */
  static async createClienteTables(
    tablePrefix: string,
    clienteId: string
  ): Promise<TableCreationResult> {
    const result: TableCreationResult = {
      success: false,
      tablesCreated: [],
      errors: []
    };

    try {
      console.log('🔧 Iniciando criação de tabelas para:', tablePrefix);

      // Lista de tabelas a serem criadas
      const tables = [
        {
          name: `${tablePrefix}_pacientes`,
          sql: `
            CREATE TABLE IF NOT EXISTS ${tablePrefix}_pacientes (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              nome VARCHAR(255) NOT NULL,
              telefone VARCHAR(20) NOT NULL,
              chat_id VARCHAR(50) UNIQUE,
              email VARCHAR(255),
              data_nascimento DATE,
              genero VARCHAR(10),
              status VARCHAR(20) CHECK (status IN ('novo', 'followup', 'topoucall', 'atende_humano', 'atendimentofinal')) DEFAULT 'novo',
              ultimo_contato TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              observacoes TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        },
        {
          name: `${tablePrefix}_agendamentos`,
          sql: `
            CREATE TABLE IF NOT EXISTS ${tablePrefix}_agendamentos (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              paciente_id UUID REFERENCES ${tablePrefix}_pacientes(id) ON DELETE CASCADE,
              data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
              tipo VARCHAR(20) CHECK (tipo IN ('consulta', 'retorno', 'exame', 'procedimento')) NOT NULL,
              status VARCHAR(20) CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'realizado', 'remarcado')) DEFAULT 'agendado',
              observacoes TEXT,
              funcionario_id UUID REFERENCES usuarios(id),
              duracao_minutos INTEGER DEFAULT 60,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        },
        {
          name: `${tablePrefix}_conversas`,
          sql: `
            CREATE TABLE IF NOT EXISTS ${tablePrefix}_conversas (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              paciente_id UUID REFERENCES ${tablePrefix}_pacientes(id) ON DELETE CASCADE,
              mensagem TEXT NOT NULL,
              tipo VARCHAR(10) CHECK (tipo IN ('entrada', 'saida')) NOT NULL,
              timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
              status VARCHAR(20) DEFAULT 'enviada',
              metadata JSONB,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        }
      ];

      // Tentar método 1: Função RPC create_cliente_tables
      try {
        const { error: rpcError } = await supabase.rpc('create_cliente_tables', {
          cliente_id: clienteId,
          table_prefix: tablePrefix
        });

        if (!rpcError) {
          console.log('✅ Tabelas criadas via RPC com sucesso');
          result.success = true;
          result.tablesCreated = tables.map(t => t.name);
          return result;
        } else {
          console.warn('⚠️ Erro na função RPC:', rpcError);
        }
      } catch (rpcError) {
        console.warn('⚠️ Função RPC não disponível:', rpcError);
      }

      // Método 2: Função exec_sql
      try {
        for (const table of tables) {
          const { error } = await supabase.rpc('exec_sql', { sql: table.sql });
          
          if (error) {
            console.error(`❌ Erro ao criar tabela ${table.name}:`, error);
            result.errors.push(`Erro ao criar ${table.name}: ${error.message}`);
          } else {
            console.log(`✅ Tabela ${table.name} criada com sucesso`);
            result.tablesCreated.push(table.name);
          }
        }

        if (result.tablesCreated.length === tables.length) {
          result.success = true;
        }
      } catch (execError) {
        console.warn('⚠️ Função exec_sql não disponível:', execError);
        result.errors.push('Função exec_sql não disponível');
      }

      // Método 3: Tentar criar via inserção de dados de teste (para verificar se as tabelas existem)
      if (!result.success) {
        console.log('🔍 Tentando verificar se as tabelas já existem...');
        
        for (const table of tables) {
          try {
            // Tentar fazer uma consulta simples para verificar se a tabela existe
            const { error } = await supabase
              .from(table.name)
              .select('*')
              .limit(1);

            if (!error) {
              console.log(`✅ Tabela ${table.name} já existe`);
              result.tablesCreated.push(table.name);
            } else {
              console.warn(`⚠️ Tabela ${table.name} não existe:`, error.message);
              result.errors.push(`Tabela ${table.name} não existe`);
            }
          } catch (checkError) {
            console.warn(`⚠️ Erro ao verificar tabela ${table.name}:`, checkError);
            result.errors.push(`Erro ao verificar ${table.name}`);
          }
        }

        if (result.tablesCreated.length === tables.length) {
          result.success = true;
        }
      }

      // Criar índices se as tabelas foram criadas
      if (result.success) {
        await this.createIndexes(tablePrefix);
      }

      return result;

    } catch (error) {
      console.error('❌ Erro geral ao criar tabelas:', error);
      result.errors.push(`Erro geral: ${error}`);
      return result;
    }
  }

  /**
   * Cria índices para as tabelas
   */
  private static async createIndexes(tablePrefix: string): Promise<void> {
    try {
      const indexes = [
        `CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_pacientes_telefone ON ${tablePrefix}_pacientes(telefone);`,
        `CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_pacientes_chat_id ON ${tablePrefix}_pacientes(chat_id);`,
        `CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_pacientes_status ON ${tablePrefix}_pacientes(status);`,
        `CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_agendamentos_paciente_id ON ${tablePrefix}_agendamentos(paciente_id);`,
        `CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_agendamentos_data_hora ON ${tablePrefix}_agendamentos(data_hora);`,
        `CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_agendamentos_status ON ${tablePrefix}_agendamentos(status);`,
        `CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_conversas_paciente_id ON ${tablePrefix}_conversas(paciente_id);`,
        `CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_conversas_timestamp ON ${tablePrefix}_conversas(timestamp);`
      ];

      for (const indexSQL of indexes) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: indexSQL });
          if (error) {
            console.warn('⚠️ Erro ao criar índice:', error);
          }
        } catch (indexError) {
          console.warn('⚠️ Erro ao criar índice:', indexError);
        }
      }

      console.log('✅ Índices criados com sucesso');
    } catch (error) {
      console.warn('⚠️ Erro ao criar índices:', error);
    }
  }

  /**
   * Verifica se as tabelas de um cliente existem
   */
  static async verifyClienteTables(tablePrefix: string): Promise<{
    exists: boolean;
    tables: Array<{
      name: string;
      exists: boolean;
      rowCount?: number;
    }>;
  }> {
    const tables = [
      `${tablePrefix}_pacientes`,
      `${tablePrefix}_agendamentos`,
      `${tablePrefix}_conversas`
    ];

    const result = {
      exists: true,
      tables: [] as Array<{
        name: string;
        exists: boolean;
        rowCount?: number;
      }>
    };

    for (const tableName of tables) {
      try {
        // Verificar se a tabela existe
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .single();

        const exists = !error && !!data;

        // Se existe, tentar contar as linhas
        let rowCount = 0;
        if (exists) {
          try {
            const { count } = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true });
            rowCount = count || 0;
          } catch (countError) {
            console.warn(`⚠️ Erro ao contar linhas da tabela ${tableName}:`, countError);
          }
        }

        result.tables.push({
          name: tableName,
          exists,
          rowCount
        });

        if (!exists) {
          result.exists = false;
        }

      } catch (error) {
        console.error(`❌ Erro ao verificar tabela ${tableName}:`, error);
        result.tables.push({
          name: tableName,
          exists: false
        });
        result.exists = false;
      }
    }

    return result;
  }
}


