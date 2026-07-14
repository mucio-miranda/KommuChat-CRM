import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { Patient } from "@/types/patient";

// Normaliza o número para o formato internacional sem espaços (ex: 5583991377388)
// Aceita qualquer formato e adiciona o +55 automaticamente se ausente
export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  return '55' + digits;
}

// Formata para exibição sem o código do país: (83) 99137-7388
export const formatPhone = (phone: string): string => {
  if (!phone) return "N/A";
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }
  if (digits.length === 11) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
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

      // Buscar todos os pacientes da tabela unificada
      const { data: iaPatients, error: iaError } = await supabase
        .from(currentIaTableName)
        .select('*');

      if (iaError) {
        console.error('❌ Erro ao buscar pacientes:', iaError);
      } else {
        console.log('✅ Pacientes encontrados:', iaPatients?.length || 0);
      }

      // fonte derivado do chatid: n8n usa formato WhatsApp com '@'
      const allPatients: Patient[] = (iaPatients || []).map(p => ({
        ...p,
        fonte: p.chatid?.includes('@') ? 'ia' as const : 'humano' as const,
      }));
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

