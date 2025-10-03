import { LogOut, User } from "lucide-react";
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

export function UserHeader() {
  const { user, signOut, isVisitor } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="w-full bg-background border-b border-border">
      <div className="flex items-center justify-end h-16 px-6">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{user?.nome}</span>
            <span className="ml-2">•</span>
            <span className="ml-2 capitalize">{user?.role}</span>
            {isVisitor && (
              <Badge variant="secondary" className="ml-2">
                <User className="w-3 h-3 mr-1" />
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
                      <User className="w-3 h-3 mr-1" />
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
    </div>
  );
}
