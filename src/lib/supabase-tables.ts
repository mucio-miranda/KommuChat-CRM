import { supabase } from './supabase';

export interface SupabaseTable {
  table_name: string;
  table_type: string;
  schema_name: string;
}

export class SupabaseTablesService {
  /**
   * Lista todas as tabelas do Supabase
   */
  static async listAllTables(): Promise<SupabaseTable[]> {
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_type, table_schema')
        .eq('table_schema', 'public')
        .order('table_name');

      if (error) throw error;

      return data.map(table => ({
        table_name: table.table_name,
        table_type: table.table_type,
        schema_name: table.table_schema
      }));
    } catch (error) {
      console.error('Erro ao listar tabelas:', error);
      return [];
    }
  }

  /**
   * Lista tabelas específicas de clientes (que começam com 'clinica_')
   */
  static async listClienteTables(): Promise<SupabaseTable[]> {
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_type, table_schema')
        .eq('table_schema', 'public')
        .like('table_name', 'clinica_%')
        .order('table_name');

      if (error) throw error;

      return data.map(table => ({
        table_name: table.table_name,
        table_type: table.table_type,
        schema_name: table.table_schema
      }));
    } catch (error) {
      console.error('Erro ao listar tabelas de clientes:', error);
      return [];
    }
  }

  /**
   * Verifica se uma tabela existe
   */
  static async tableExists(tableName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gera sugestões de nomes de tabela baseado no nome da clínica
   */
  static generateTableSuggestions(clinicName: string): string[] {
    if (!clinicName) return [];

    // Limpar e normalizar o nome
    const cleanName = clinicName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '_') // Substitui espaços por underscore
      .substring(0, 20); // Limita o tamanho

    const suggestions = [
      `clinica_${cleanName}`,
      `clinica_${cleanName}_pacientes`,
      `clinica_${cleanName}_dados`,
      `clinica_${cleanName}_sistema`
    ];

    return suggestions;
  }

  /**
   * Valida se o nome da tabela é válido
   */
  static validateTableName(tableName: string): { isValid: boolean; error?: string } {
    if (!tableName) {
      return { isValid: true }; // Nome vazio é válido (será auto-gerado)
    }

    // Verificar tamanho
    if (tableName.length > 63) {
      return { isValid: false, error: 'Nome da tabela muito longo (máximo 63 caracteres)' };
    }

    // Verificar caracteres válidos
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return { 
        isValid: false, 
        error: 'Nome deve conter apenas letras, números e underscore, começando com letra ou underscore' 
      };
    }

    // Verificar se não começa com número
    if (/^[0-9]/.test(tableName)) {
      return { isValid: false, error: 'Nome não pode começar com número' };
    }

    return { isValid: true };
  }

  /**
   * Obtém informações de uma tabela específica
   */
  static async getTableInfo(tableName: string): Promise<{
    columns: Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>;
    row_count: number;
  } | null> {
    try {
      // Obter colunas
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');

      if (columnsError) throw columnsError;

      // Obter contagem de linhas (aproximada)
      const { data: countData, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      const row_count = countError ? 0 : (countData as any)?.length || 0;

      return {
        columns: columns || [],
        row_count
      };
    } catch (error) {
      console.error('Erro ao obter informações da tabela:', error);
      return null;
    }
  }
}

