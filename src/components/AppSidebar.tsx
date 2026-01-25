import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MessageCircle, 
  Settings,
  UserCog,
  LogOut,
  UserPlus
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "./Logo";

const getMenuItems = (userRole: string) => {
  const baseItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Pacientes", url: "/pacientes", icon: Users },
    { title: "Calendário", url: "/calendario", icon: Calendar },
    // { title: "Usuários", url: "/usuarios", icon: UserCog }, // Movido para Admin Dashboard
    { title: "Chat", url: "/chat", icon: MessageCircle },
  ];

  // Adicionar "Funcionários" para admin_clinica OU admin (após Chat)
  if (userRole === 'admin_clinica' || userRole === 'admin') {
    baseItems.push({ title: "Funcionários", url: "/funcionarios", icon: UserPlus });
  }

  return baseItems;
};


export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { signOut, user } = useAuth();

  // Debug logs
  console.log('🔍 AppSidebar - Usuário atual:', user);
  console.log('🔍 AppSidebar - Role do usuário:', user?.role);
  console.log('🔍 AppSidebar - É admin_clinica?', user?.role === 'admin_clinica');
  console.log('🔍 AppSidebar - É admin?', user?.role === 'admin');
  console.log('🔍 AppSidebar - Tem acesso aos funcionários?', user?.role === 'admin_clinica' || user?.role === 'admin');

  const menuItems = getMenuItems(user?.role || '');
  console.log('🔍 AppSidebar - Menu items:', menuItems);

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Redirecionar para a página de login após logout
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <Sidebar className="gradient-kommu border-r border-sidebar-border">
      <SidebarHeader className="h-16 flex items-center px-4 pt-2 pb-0 border-b border-sidebar-border">
        <Logo 
          size="md"
        />
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={`sidebar-nav-item ${
                        isActive(item.url)
                          ? "active"
                          : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${state === "collapsed" ? "mx-auto" : ""}`} />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      {/* Footer com botão de logout */}
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="w-full text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className={`w-5 h-5 ${state === "collapsed" ? "mx-auto" : ""}`} />
              {state !== "collapsed" && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}