import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MessageCircle, 
  UserPlus,
  LogOut
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const getMenuItems = (userRole: string) => {
  const baseItems = [
    { title: "Home", url: "/", icon: LayoutDashboard },
    { title: "Pacientes", url: "/pacientes", icon: Users },
    { title: "Agenda", url: "/calendario", icon: Calendar },
    { title: "Chat", url: "/chat", icon: MessageCircle },
  ];

  if (userRole === 'admin_clinica' || userRole === 'admin') {
    baseItems.push({ title: "Usuários", url: "/funcionarios", icon: UserPlus });
  }

  return baseItems;
};

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { signOut, user } = useAuth();
  const isCollapsed = state === "collapsed";

  const menuItems = getMenuItems(user?.role || '');

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const userInitial = user?.nome?.charAt(0)?.toUpperCase() || 'U';
  const roleBadge = user?.role === 'admin_clinica' || user?.role === 'admin' ? 'Admin' : 'User';

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="h-16 flex items-center px-4 pt-2 pb-0 border-b border-sidebar-border">
        <Logo size="md" />
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={`sidebar-nav-item ${
                        isActive(item.url)
                          ? "active"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? "mx-auto" : ""}`} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className="bg-muted text-foreground text-sm font-semibold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.nome || 'Usuário'}
              </p>
              <Badge className="mt-0.5 bg-primary text-primary-foreground text-[10px] px-2 py-0 h-5 font-semibold">
                {roleBadge}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="w-full text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
            >
              <LogOut className={`w-5 h-5 ${isCollapsed ? "mx-auto" : ""}`} />
              {!isCollapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
