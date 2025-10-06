import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft, Search, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-4xl font-bold text-foreground">404</CardTitle>
            <CardDescription className="text-lg">
              Página não encontrada
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                A página que você está procurando não existe ou foi movida.
              </p>
              <p className="text-sm text-muted-foreground">
                URL tentada: <code className="bg-muted px-1 rounded text-xs">{location.pathname}</code>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleGoHome} 
                className="flex-1"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir para o Dashboard
              </Button>
              
              <Button 
                onClick={handleGoBack} 
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
            
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Se você acredita que isso é um erro, entre em contato com o suporte.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NotFound;
