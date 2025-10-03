import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  TrendingUp,
  MessageCircle,
  AlertCircle,
  Filter
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabase } from "@/hooks/useSupabase";
// WhatsApp será adicionado em breve
// import { useWhatsApp } from "@/contexts/WhatsAppContext";
import { toast } from "@/components/ui/use-toast";

// Tipagem mínima da tabela
type Row = {
  id: string;
  nome?: string | null;
  telefone?: string | null;
  chatid?: string | null;
  atende_humano?: string | null;
  email?: string | null;
  setdata?: string | null;
  followup?: string | null;
  follow?: string | null;
  topoucall?: string | null;
  atendimentofinal?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
};


export default function Dashboard() {
  const { user } = useAuth();
  const { read: supabaseRead, write: supabaseWrite, config: supabaseConfig } = useSupabase();
  // WhatsApp será adicionado em breve
  // const { connection: whatsappConnection, chats: whatsappChats } = useWhatsApp();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        
        if (!supabaseRead) {
          console.log('❌ Supabase não disponível');
          setRows([]);
          setLoading(false);
          return;
        }

        let tableName = "kommuchat_mvp"; // Tabela padrão para visitantes
        
        console.log('🔍 DASHBOARD - user:', user?.email);
        
        // Se o usuário está logado, buscar a tabela selecionada nas configurações
        if (user) {
          console.log('🔍 DASHBOARD - Usuário logado, buscando tabela...');
          
          const { data: configData, error: configError } = await supabaseConfig
            .from('configuracoes_cliente')
            .select('valor')
            .eq('cliente_id', user.cliente_id)
            .eq('chave', 'tabela_supabase')
            .single();
          
          console.log('🔍 DASHBOARD - Config result:', { configData, configError });
          
          if (!configError && configData?.valor && configData.valor.trim() !== '') {
            tableName = configData.valor;
            console.log('✅ DASHBOARD - Tabela alterada para:', tableName);
          } else {
            console.log('⚠️ DASHBOARD - Mantendo tabela padrão:', tableName);
          }
        } else {
          console.log('ℹ️ DASHBOARD - Usuário não logado, usando padrão:', tableName);
        }

        console.log('🎯 DASHBOARD - Carregando dados da tabela:', tableName);
        
        const { data, error } = await supabaseRead
          .from(tableName)
          .select("*")
          .limit(200);
          
        if (error) {
          console.error('❌ DASHBOARD - Erro ao carregar dados:', error);
          throw error;
        }
        
        console.log('✅ DASHBOARD - Dados carregados:', data?.length || 0, 'registros da tabela', tableName);
        setRows(data ?? []);
      } catch (e: any) {
        console.error('❌ Erro geral:', e);
        setRows([]);
        toast({ description: "Não foi possível carregar dados do Supabase." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [supabaseRead, supabaseConfig, user]);

  // Ordena no cliente por updated_at, depois created_at
  const sorted = useMemo(() => {
    const list = (rows ?? []).slice();
    list.sort((a, b) => {
      const ad = new Date(a.updated_at || a.created_at || 0).getTime();
      const bd = new Date(b.updated_at || b.created_at || 0).getTime();
      return bd - ad;
    });
    return list;
  }, [rows]);

  const metrics = useMemo(() => {
    const list = sorted;
    const total = list.length;
    const consultasHoje = 0; // placeholder
    const concluidos = list.filter(r => r.atendimentofinal)?.length;
    const pendentesFollow = list.filter(r => r.followup)?.length;
    const conversas = list.filter(r => r.atende_humano || r.topoucall)?.length;
    const conversao = total ? Math.round(((concluidos || 0) / total) * 100) : 0;

    return [
      { title: "Pacientes Ativos", value: String(total), change: "", changeType: "positive" as const, icon: Users },
      { title: "Consultas Hoje", value: String(consultasHoje), change: "", changeType: "positive" as const, icon: Calendar },
      { title: "Atendimentos Concluídos", value: String(concluidos || 0), change: "", changeType: "positive" as const, icon: CheckCircle },
      { title: "Follow-ups Pendentes", value: String(pendentesFollow || 0), change: "", changeType: "negative" as const, icon: Clock },
      { title: "Conversas WhatsApp", value: String(conversas || 0), change: "", changeType: "positive" as const, icon: MessageCircle },
      { title: "Taxa de Conversão", value: `${conversao}%`, change: "", changeType: "positive" as const, icon: TrendingUp },
    ];
  }, [sorted]);


  return (
    <div className="space-y-8 -ml-60">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral do seu CRM clínico
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10">
              <Filter className="w-4 h-4" />
              Filtrar período
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
              <TrendingUp className="w-4 h-4" />
              Relatórios
            </Button>
          </div>
        </div>

        {/* Grid de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric, index) => (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              changeType={metric.changeType}
              icon={metric.icon}
            />
          ))}
        </div>
      </div>
  );
}