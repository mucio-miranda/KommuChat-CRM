import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabase } from "@/hooks/useSupabase";
import { useEffect, useState } from "react";

interface GoogleCalendarSetupProps {
  onConnect: () => void;
  onDisconnect?: () => void;
  isConnected: boolean;
}

export function GoogleCalendarSetup({ onConnect, onDisconnect, isConnected }: GoogleCalendarSetupProps) {
  const { user } = useAuth();
  const { config: supabaseConfig } = useSupabase();
  const [googleEmail, setGoogleEmail] = useState<string>('');

  useEffect(() => {
    const loadGoogleEmail = async () => {
      if (!user) return;

      try {
        const { data: configData, error } = await supabaseConfig
          .from('configuracoes_cliente')
          .select('valor')
          .eq('cliente_id', user.cliente_id)
          .eq('chave', 'google_calendar_email')
          .single();

        if (!error && configData?.valor) {
          setGoogleEmail(configData.valor);
        } else {
          // Fallback para o email do usuário
          setGoogleEmail(user.email);
        }
      } catch (err) {
        console.log('Erro ao carregar email do Google Calendar:', err);
        setGoogleEmail(user.email);
      }
    };

    loadGoogleEmail();
  }, [user, supabaseConfig]);

  if (isConnected) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            Google Calendar Conectado
          </CardTitle>
          <CardDescription className="text-green-700">
            Sua conta Google Calendar está conectada com sucesso!
            {googleEmail && (
              <span className="block mt-1 text-sm">
                Conta: <code className="bg-green-100 px-1 rounded">{googleEmail}</code>
              </span>
            )}
          </CardDescription>
        </CardHeader>
        {onDisconnect && (
          <CardContent>
            <Button 
              onClick={onDisconnect}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Desconectar Google Calendar
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Calendar className="w-5 h-5" />
          Conectar Google Calendar
        </CardTitle>
        <CardDescription className="text-blue-700">
          Conecte sua conta Google Calendar para sincronizar eventos
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Importante:</strong> Use a conta <code className="bg-amber-100 px-1 rounded">{googleEmail || 'seu email'}</code> 
            {googleEmail ? ' que está configurada para este cliente.' : ' que tem as credenciais configuradas no Google Cloud Console.'}
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium text-blue-800">Passos para conectar:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
            <li>Clique no botão "Conectar Google Calendar" abaixo</li>
            <li>Na tela de login do Google, <strong>selecione ou faça login com</strong> <code className="bg-blue-100 px-1 rounded">{googleEmail || 'seu email'}</code></li>
            <li>Autorize o acesso aos dados do calendário</li>
            <li>Você será redirecionado de volta para a aplicação</li>
          </ol>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={onConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Conectar Google Calendar
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Google Cloud Console
          </Button>
        </div>

        <div className="text-xs text-blue-600 bg-blue-100 p-3 rounded-lg">
          <strong>Dica:</strong> Se você não conseguir ver a opção de selecionar conta, 
          faça logout da conta atual do Google primeiro, depois tente conectar novamente.
        </div>
      </CardContent>
    </Card>
  );
}
