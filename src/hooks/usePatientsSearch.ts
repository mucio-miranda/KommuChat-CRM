import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { Patient } from "@/types/patient";

// Função para formatar o telefone
export const formatPhone = (phone: string): string => {
  if (!phone) return "N/A";
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 11) {
    return `(${cleanPhone.slice(0,2)}) ${cleanPhone.slice(2,7)}-${cleanPhone.slice(7)}`;
  } else if (cleanPhone.length === 10) {
    return `(${cleanPhone.slice(0,2)}) ${cleanPhone.slice(2,6)}-${cleanPhone.slice(6)}`;
  }
  return phone;
};

export function usePatientsSearch() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [iaTableName, setIaTableName] = useState<string>("kommuchat_mvp");
  
  const { user } = useAuth();
  const { read: supabase, config: supabaseConfig, write: supabaseWrite } = useSupabase();

  const loadPatients = useCallback(async () => {
    if (!user || !supabase || !supabaseConfig) {
      console.log('❌ usePatientsSearch: user ou supabase não disponível', { user: !!user, supabase: !!supabase, config: !!supabaseConfig });
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 usePatientsSearch: Iniciando busca de pacientes...');
      setLoading(true);
      
      // Obter configuração da tabela IA do banco de dados
      let currentIaTableName = "kommuchat_mvp"; // Padrão
      
      if (user) {
        const { data: configData, error: configError } = await supabaseConfig
          .from('configuracoes_cliente')
          .select('valor')
          .eq('cliente_id', user.cliente_id)
          .eq('chave', 'tabela_supabase')
          .single();
        
        if (!configError && configData?.valor && configData.valor.trim() !== '') {
          currentIaTableName = configData.valor;
          console.log('✅ Tabela IA encontrada nas configurações:', currentIaTableName);
        } else {
          console.log('⚠️ Usando tabela IA padrão:', currentIaTableName);
        }
      }
      
      setIaTableName(currentIaTableName);
      console.log('📋 usePatientsSearch: Tabela IA:', currentIaTableName);

      // Buscar pacientes da IA (sem ordenação, pois nem todas as tabelas têm created_at)
      const { data: iaPatients, error: iaError } = await supabase
        .from(currentIaTableName)
        .select('*');

      if (iaError) {
        console.error('❌ Erro ao buscar pacientes IA:', iaError);
      } else {
        console.log('✅ Pacientes IA encontrados:', iaPatients?.length || 0);
      }

      // Buscar pacientes manuais (com ordenação, pois sabemos que a tabela tem created_at)
      let manualPatients = null;
      let manualError = null;
      
      if (supabaseWrite) {
        const result = await supabaseWrite
          .from('pacientes_manuais')
          .select('*')
          .eq('cliente_id', user.cliente_id)
          .order('created_at', { ascending: false });
        
        manualPatients = result.data;
        manualError = result.error;
      }

      if (manualError) {
        console.error('❌ Erro ao buscar pacientes manuais:', manualError);
      } else {
        console.log('✅ Pacientes manuais encontrados:', manualPatients?.length || 0);
      }

      // Combinar pacientes marcando a fonte
      const allPatients: Patient[] = [
        ...(iaPatients || []).map(p => ({ ...p, fonte: 'ia' as const })),
        ...(manualPatients || []).map(p => ({ ...p, fonte: 'humano' as const }))
      ];
      console.log('📊 Total de pacientes antes do filtro:', allPatients.length);

      // TEMPORÁRIO: Removendo filtro de setdata para debug
      // Aplicar filtro de setdata (igual à página de pacientes)
      // Filtrar pacientes da IA que não têm setdata preenchida
      // Mas incluir pacientes manuais independente do setdata
      
      // Versão com filtro (comentada temporariamente)
      // const filteredPatients = allPatients.filter(patient => {
      //   const hasSetdata = patient.setdata !== null && patient.setdata !== undefined && patient.setdata !== '';
      //   const isManualPatient = patient.fonte === 'humano';
      //   return isManualPatient || hasSetdata;
      // });
      
      // Versão sem filtro (para debug) - mostra TODOS os pacientes
      const filteredPatients = allPatients;
      
      console.log('✅ Total de pacientes após filtro setdata:', filteredPatients.length);
      console.log('📋 Primeiros 3 pacientes:', filteredPatients.slice(0, 3).map(p => ({ nome: p.nome, fonte: p.fonte, setdata: p.setdata })));

      setPatients(filteredPatients);
    } catch (err) {
      console.error('❌ Erro ao carregar pacientes:', err);
    } finally {
      setLoading(false);
    }
  }, [user, supabase, supabaseConfig, supabaseWrite]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Função para buscar paciente por ID e fonte
  const getPatientById = useCallback((id: number, fonte: 'ia' | 'humano'): Patient | undefined => {
    return patients.find(p => p.id === id && p.fonte === fonte);
  }, [patients]);

  return {
    patients,
    loading,
    iaTableName,
    refreshPatients: loadPatients,
    getPatientById,
  };
}

