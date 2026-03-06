import { useState, useEffect, useCallback } from "react";
import { MessageCircle, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabase } from "@/hooks/useSupabase";
import { useWhatsApp } from "@/contexts/WhatsAppContext";
import { useProfilePicture } from "@/hooks/useProfilePicture";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PatientWithWhatsApp } from "@/lib/whatsapp-types";
import {
  parseWhatsAppMessages,
  filterPatientsWithWhatsApp,
  sortPatientsByLastMessage,
  getLastMessagePreview,
  getLastMessageTimestamp,
  formatTimestamp,
  getPatientName,
  getPatientPhone,
} from "@/lib/whatsapp-helpers";

function getInitials(name: string): string {
  if (!name || name === "Paciente sem nome") return "";
  const words = name.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function ConversationAvatar({ phoneNumber, clienteId, name }: { phoneNumber: string; clienteId: string | undefined; name: string }) {
  const profilePicture = useProfilePicture(phoneNumber, clienteId);
  const initials = getInitials(name);

  return (
    <Avatar className="h-10 w-10 flex-shrink-0">
      {profilePicture && (
        <AvatarImage src={profilePicture} alt="Profile" className="object-cover" />
      )}
      <AvatarFallback className="bg-[hsl(var(--tertiary))]">
        {initials ? (
          <span className="text-primary font-semibold text-sm">{initials}</span>
        ) : (
          <User className="w-5 h-5 text-primary" />
        )}
      </AvatarFallback>
    </Avatar>
  );
}

export function RecentConversationsCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { read: supabase, config: supabaseConfig } = useSupabase();
  const { connection } = useWhatsApp();
  const [patients, setPatients] = useState<PatientWithWhatsApp[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }

    try {
      let tableName = "kommuchat_mvp";
      if (user && supabaseConfig) {
        const { data: configData, error: configError } = await supabaseConfig
          .from("configuracoes_cliente")
          .select("valor")
          .eq("cliente_id", user.cliente_id)
          .eq("chave", "tabela_supabase")
          .single();

        if (!configError && configData?.valor?.trim()) {
          tableName = configData.valor;
        }
      }

      const { data, error } = await supabase.from(tableName).select("*");
      if (error) { console.error("Error loading conversations:", error); return; }

      const patientsData = (data || []) as PatientWithWhatsApp[];
      const withWhatsApp = filterPatientsWithWhatsApp(patientsData);
      const sorted = sortPatientsByLastMessage(withWhatsApp);
      setPatients(sorted.slice(0, 8));
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, supabaseConfig, user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(var(--tertiary))] flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Conversas Recentes</h3>
        </div>
        <button
          onClick={() => navigate("/chat")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver mais
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px] scrollbar-gray">
        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-8">Carregando...</div>
        ) : patients.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">Nenhuma conversa encontrada</div>
        ) : (
          patients.map((patient) => {
            const name = getPatientName(patient);
            const phone = getPatientPhone(patient);
            const interactions = parseWhatsAppMessages(patient.whatsapp);
            const lastMessage = getLastMessagePreview(interactions);
            const lastTimestamp = getLastMessageTimestamp(interactions);
            const timeStr = lastTimestamp ? formatTimestamp(lastTimestamp) : "";

            return (
              <div
                key={patient.id}
                onClick={() => navigate("/chat")}
                className="flex items-start gap-3 p-3 rounded-lg border border-[#EEEEEE] dark:border-[#2D2D2D] hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <ConversationAvatar
                  phoneNumber={phone}
                  clienteId={user?.cliente_id}
                  name={name}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                  <p className="text-xs text-muted-foreground truncate">{lastMessage || "Sem mensagens"}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {timeStr && (
                    <span className="text-[11px] text-muted-foreground">{timeStr}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
