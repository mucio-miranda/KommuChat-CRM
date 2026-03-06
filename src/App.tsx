import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { GoogleCalendarProvider } from "@/contexts/GoogleCalendarContextSimple";
import { WhatsAppProvider } from "@/contexts/WhatsAppContext";
import Index from "./pages/Index";
import Pacientes from "./pages/Pacientes";
import Calendario from "./pages/Calendario";
// UserManagement movido para AdminDashboard
import Automatizacoes from "./pages/Automatizacoes";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeManagement from "./pages/EmployeeManagement";
// import TestPage from "./pages/TestPage";
import GoogleCallback from "./pages/GoogleCallback";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Componente para rotas protegidas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Componente para rotas administrativas
function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { adminUser, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!adminUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/pacientes" element={
        <ProtectedRoute>
          <Pacientes />
        </ProtectedRoute>
      } />
      <Route path="/calendario" element={
        <ProtectedRoute>
          <Calendario />
        </ProtectedRoute>
      } />
      {/* Rota /usuarios removida - funcionalidade movida para /admin/dashboard */}
      <Route path="/chat" element={
        <ProtectedRoute>
          <Automatizacoes />
        </ProtectedRoute>
      } />
      <Route path="/funcionarios" element={
        <ProtectedRoute>
          <EmployeeManagement />
        </ProtectedRoute>
      } />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <GoogleCalendarProvider>
            <WhatsAppProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </TooltipProvider>
            </WhatsAppProvider>
          </GoogleCalendarProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
