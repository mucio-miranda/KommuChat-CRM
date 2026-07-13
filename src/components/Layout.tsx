import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Menu, ChevronLeft, LayoutDashboard, Users, Calendar, MessageCircle, UserPlus, LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useLocation, useNavigate } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
  defaultSidebarOpen?: boolean;
  lastRefresh?: Date;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

const pageConfig: Record<string, { title: string; icon: LucideIcon }> = {
  "/": { title: "Home", icon: LayoutDashboard },
  "/dashboard": { title: "Home", icon: LayoutDashboard },
  "/pacientes": { title: "Pacientes", icon: Users },
  "/calendario": { title: "Agenda", icon: Calendar },
  "/chat": { title: "Chat", icon: MessageCircle },
  "/funcionarios": { title: "Usuários", icon: UserPlus },
};

function SidebarCollapseButton() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors dark:bg-[#292929] dark:text-white dark:border-[#292929] dark:hover:bg-white/10 dark:hover:text-white dark:hover:[background-image:none]"
      title="Colapsar/expandir sidebar"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>
  );
}

export function Layout({ children, defaultSidebarOpen = true, lastRefresh, isRefreshing, onRefresh }: LayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { title: pageTitle, icon: PageIcon } = pageConfig[location.pathname] || pageConfig["/"];

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border flex-shrink-0 sticky top-0 z-10 bg-background">
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <div className="hidden lg:block">
                  <SidebarCollapseButton />
                </div>

                <div className="flex items-center gap-2">
                  <PageIcon className="w-5 h-5 text-foreground" />
                  <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
                </div>

                {lastRefresh && (
                  <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                    Última Atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
                  </span>
                )}

              </div>
              
              <div className="flex items-center gap-3">
                <ThemeToggle />
                
                <Button
                  size="sm"
                  className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg px-4"
                  onClick={() => {
                    if (location.pathname === '/calendario') {
                      navigate('/calendario?openModal=true');
                    } else {
                      navigate('/calendario');
                    }
                  }}
                >
                  + Nova Consulta
                </Button>
              </div>
            </div>
          </header>
          
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
