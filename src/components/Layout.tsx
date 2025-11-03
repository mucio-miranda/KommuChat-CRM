import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Menu, LogOut, User, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: React.ReactNode;
  defaultSidebarOpen?: boolean; // Nova prop para controlar o estado inicial da sidebar
}

// Componente interno para o botão de toggle da sidebar
function SidebarToggleButton() {
  const { toggleSidebar, state } = useSidebar();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="hidden lg:flex h-7 w-7"
      title={state === "collapsed" ? "Expandir sidebar" : "Minimizar sidebar"}
    >
      <Menu className="w-5 h-5" />
      <span className="sr-only">
        {state === "collapsed" ? "Expandir sidebar" : "Minimizar sidebar"}
      </span>
    </Button>
  );
}

export function Layout({ children, defaultSidebarOpen = true }: LayoutProps) {
  const { user, signOut, isVisitor } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Header com informações do usuário */}
          <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <SidebarToggleButton />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{user?.nome}</span>
                  <span className="ml-2">•</span>
                  <span className="ml-2 capitalize">{user?.role}</span>
                  {isVisitor && (
                    <Badge variant="secondary" className="ml-2">
                      <Eye className="w-3 h-3 mr-1" />
                      Visitante
                    </Badge>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.nome}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                        {isVisitor && (
                          <Badge variant="outline" className="w-fit mt-1">
                            <Eye className="w-3 h-3 mr-1" />
                            Modo Demo
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          
          {/* Conteúdo principal */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}