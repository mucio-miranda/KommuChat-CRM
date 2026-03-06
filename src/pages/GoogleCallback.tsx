import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { googleCalendarServiceHybrid } from '@/lib/google-calendar-hybrid';
import { supabaseGoogleTokensService } from '@/lib/supabase-google-tokens';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setErrorMessage('Acesso negado pelo usuário');
          return;
        }

        if (!code) {
          setStatus('error');
          setErrorMessage('Código de autorização não encontrado');
          return;
        }

        // Trocar código por tokens
        const tokens = await googleCalendarServiceHybrid.exchangeCodeForTokens(code);
        console.log('🔑 Tokens recebidos do Google:', { 
          has_access_token: !!tokens.access_token,
          has_refresh_token: !!tokens.refresh_token,
          expires_in: tokens.expires_in
        });
        
        // SALVAR TOKENS NO SUPABASE (única fonte de verdade)
        await supabaseGoogleTokensService.saveTokens({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
          scope: tokens.scope,
          token_type: tokens.token_type
        });
        console.log('💾 Tokens salvos no Supabase com sucesso');
        
        // Salvar apenas estado de conexão no localStorage (NÃO tokens)
        localStorage.setItem('google_calendar_connected', 'true');
        
        setStatus('success');
        
        // Redirecionar para o calendário após 2 segundos e forçar refresh
        setTimeout(() => {
          // Usar window.location.href para forçar um refresh completo da página
          window.location.href = '/calendario';
        }, 2000);

      } catch (error) {
        console.error('Erro no callback:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    navigate('/calendario');
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {status === 'loading' && <Loader2 className="w-6 h-6 animate-spin" />}
              {status === 'success' && <CheckCircle className="w-6 h-6 text-green-500" />}
              {status === 'error' && <XCircle className="w-6 h-6 text-red-500" />}
              Conectando ao Google Calendar
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Processando autorização...'}
              {status === 'success' && 'Conexão estabelecida com sucesso!'}
              {status === 'error' && 'Erro ao conectar com o Google Calendar'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            {status === 'loading' && (
              <p className="text-sm text-muted-foreground">
                Aguarde enquanto processamos sua autorização...
              </p>
            )}
            
            {status === 'success' && (
              <div className="space-y-2">
                <p className="text-sm text-green-600">
                  Sua conta Google Calendar foi conectada com sucesso!
                </p>
                <p className="text-xs text-muted-foreground">
                  Redirecionando para o calendário e atualizando a página...
                </p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-4">
                <p className="text-sm text-red-600">
                  {errorMessage}
                </p>
                <Button onClick={handleRetry} variant="outline">
                  Tentar Novamente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
