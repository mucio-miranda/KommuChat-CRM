import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseCrm } from '../lib/supabase-crm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Trash2, UserPlus, Eye, Edit } from 'lucide-react';
import { Layout } from '../components/Layout';

interface Employee {
  id: string;
  username: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  created_at: string;
  created_by: string;
}

const EmployeeManagement: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [clienteNome, setClienteNome] = useState<string>('');

  // Debug logs
  console.log('🔍 EmployeeManagement - Usuário atual:', user);
  console.log('🔍 EmployeeManagement - Role do usuário:', user?.role);
  console.log('🔍 EmployeeManagement - É admin?', user?.role === 'admin');
  console.log('🔍 EmployeeManagement - Tem acesso?', user?.role === 'admin');
  
  // Form states
  const [newEmployee, setNewEmployee] = useState({
    username: '',
    nome: '',
    email: '',
    password: '',
    role: 'funcionario'
  });

  // Função para gerar username automaticamente
  const generateUsername = (baseUsername: string) => {
    if (!baseUsername || !clienteNome) return '';
    
    // Remover espaços e caracteres especiais, converter para lowercase
    const cleanUsername = baseUsername
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    
    const cleanClienteNome = clienteNome
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    
    return `${cleanUsername}.${cleanClienteNome}`;
  };

  // Função para lidar com mudanças no campo de username
  const handleUsernameChange = (value: string) => {
    // Remover espaços automaticamente
    const cleanValue = value.replace(/\s/g, '');
    setNewEmployee({ ...newEmployee, username: cleanValue });
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchEmployees();
      fetchClienteNome();
    }
  }, [user]);

  const fetchClienteNome = async () => {
    try {
      if (!user?.cliente_id) return;
      
      const { data, error } = await supabaseCrm
        .from('clientes')
        .select('nome')
        .eq('id', user.cliente_id)
        .single();

      if (error) throw error;
      setClienteNome(data?.nome || '');
    } catch (err) {
      console.error('Erro ao buscar nome da clínica:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseCrm
        .from('usuarios')
        .select('*')
        .eq('cliente_id', user?.cliente_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error('Erro ao buscar funcionários:', err);
      setError('Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      // Gerar username final com o nome da clínica
      const finalUsername = generateUsername(newEmployee.username);
      
      if (!finalUsername) {
        setError('Nome da clínica não encontrado');
        return;
      }

      // Verificar se username já existe
      const { data: existingUser } = await supabaseCrm
        .from('usuarios')
        .select('username')
        .eq('username', finalUsername)
        .single();

      if (existingUser) {
        setError('Username já está em uso');
        return;
      }

      // Verificar se email já existe (apenas se email foi fornecido)
      if (newEmployee.email && newEmployee.email.trim() !== '') {
        const { data: existingEmail } = await supabaseCrm
          .from('usuarios')
          .select('email')
          .eq('email', newEmployee.email)
          .single();

        if (existingEmail) {
          setError('Email já está em uso');
          return;
        }
      }

      // Criar hash da senha
      const { data: hashedPassword, error: hashError } = await supabaseCrm
        .rpc('hash_password', { password_param: newEmployee.password });

      if (hashError) throw hashError;

      // Criar funcionário
      const { data, error } = await supabaseCrm
        .from('usuarios')
        .insert({
          username: finalUsername,
          nome: newEmployee.nome,
          email: newEmployee.email && newEmployee.email.trim() !== '' ? newEmployee.email : null,
          password: hashedPassword, // Usar a coluna password existente
          role: newEmployee.role,
          cliente_id: user?.cliente_id,
          created_by: user?.id,
          ativo: true
        })
        .select()
        .single();

      if (error) throw error;

      setSuccess('Funcionário criado com sucesso!');
      setIsCreateDialogOpen(false);
      setNewEmployee({ username: '', nome: '', email: '', password: '', role: 'funcionario' });
      fetchEmployees();
    } catch (err) {
      console.error('Erro ao criar funcionário:', err);
      setError('Erro ao criar funcionário');
    }
  };

  const handleToggleEmployeeStatus = async (employeeId: string, currentStatus: boolean) => {
    // Verificar se é o usuário admin atual
    if (employeeId === user?.id) {
      setError('Não é possível desativar o usuário admin atual');
      return;
    }

    try {
      const { error } = await supabaseCrm
        .from('usuarios')
        .update({ ativo: !currentStatus })
        .eq('id', employeeId);

      if (error) throw error;

      setSuccess(`Funcionário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
      fetchEmployees();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      setError('Erro ao alterar status do funcionário');
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    // Verificar se é o usuário admin atual
    if (employeeId === user?.id) {
      setError('Não é possível excluir o usuário admin atual');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;

    try {
      const { error } = await supabaseCrm
        .from('usuarios')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;

      setSuccess('Funcionário excluído com sucesso!');
      fetchEmployees();
    } catch (err) {
      console.error('Erro ao excluir funcionário:', err);
      setError('Erro ao excluir funcionário');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertDescription>
              Acesso negado. Apenas administradores podem gerenciar funcionários.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Funcionários</h1>
          <p className="text-muted-foreground">
            Gerencie os funcionários da sua clínica
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Funcionário</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo funcionário
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newEmployee.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="usuario123"
                  required
                />
                <div className="text-sm text-muted-foreground">
                  <strong>Preview:</strong> {generateUsername(newEmployee.username) || 'Digite um username'}
                  <br />
                  <span className="text-xs">O nome da clínica será adicionado automaticamente ao final</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={newEmployee.nome}
                  onChange={(e) => setNewEmployee({ ...newEmployee, nome: e.target.value })}
                  placeholder="João Silva"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email (Opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  placeholder="joao.silva@clinica.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  placeholder="Senha segura"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <select
                  id="role"
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="funcionario">Funcionário</option>
                  <option value="admin_clinica">Admin da Clínica</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Funcionário</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Carregando funcionários...</div>
        ) : employees.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Nenhum funcionário encontrado</p>
            </CardContent>
          </Card>
        ) : (
          employees.map((employee) => (
            <Card key={employee.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {employee.nome}
                      {employee.id === user?.id && (
                        <Badge variant="destructive">
                          Admin Atual
                        </Badge>
                      )}
                      <Badge variant={employee.ativo ? "default" : "secondary"}>
                        {employee.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      @{employee.username} • {employee.email}
                    </CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleEmployeeStatus(employee.id, employee.ativo)}
                      disabled={employee.id === user?.id}
                      title={employee.id === user?.id ? "Não é possível desativar o usuário admin atual" : ""}
                    >
                      {employee.ativo ? "Desativar" : "Ativar"}
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteEmployee(employee.id)}
                      disabled={employee.id === user?.id}
                      title={employee.id === user?.id ? "Não é possível excluir o usuário admin atual" : ""}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Função:</span> {employee.role}
                  </div>
                  <div>
                    <span className="font-medium">Criado em:</span> {new Date(employee.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </div>
    </Layout>
  );
};

export default EmployeeManagement;
