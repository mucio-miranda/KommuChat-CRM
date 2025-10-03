# 🏗️ Arquitetura da Solução de Credenciais Google

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERFACE ADMINISTRATIVA                    │
├─────────────────────────────────────────────────────────────────┤
│  AdminDashboard.tsx  │  AdminCredentialsManager.tsx           │
│  - Dashboard geral   │  - Gerenciar credenciais por cliente    │
│  - Estatísticas      │  - Criar/editar/remover credenciais     │
│  - Ações rápidas     │  - Download de arquivos .env            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVIÇOS DE NEGÓCIO                         │
├─────────────────────────────────────────────────────────────────┤
│  SecureCredentialsManager  │  ClientEnvGenerator              │
│  - Criptografia AES-256    │  - Geração de .env por cliente    │
│  - Validação de credenciais│  - Template personalizado         │
│  - Logs de auditoria       │  - Upload para storage            │
│                            │                                  │
│  AutoDeploymentService     │  SupabaseCrm                     │
│  - Deploy automático       │  - Conexão com banco CRM          │
│  - Integração Vercel/Netlify│  - Operações CRUD                │
│  - Webhooks genéricos      │  - RLS e segurança                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ARMAZENAMENTO SEGURO                        │
├─────────────────────────────────────────────────────────────────┤
│  Supabase Database          │  Supabase Storage                │
│  ┌─────────────────────────┐│  ┌─────────────────────────────┐ │
│  │ google_credentials      ││  │ client-configs bucket      │ │
│  │ - client_id (encrypted) ││  │ - cliente-{id}-.env files  │ │
│  │ - client_secret (enc)   ││  │ - Acesso restrito          │ │
│  │ - redirect_uri          ││  │ - Políticas RLS            │ │
│  │ - calendar_id           ││  └─────────────────────────────┘ │
│  │ - configured            ││                                  │
│  └─────────────────────────┘│                                  │
│  ┌─────────────────────────┐│                                  │
│  │ deployment_configs      ││                                  │
│  │ - deployment_url        ││                                  │
│  │ - deployment_token      ││                                  │
│  │ - environment           ││                                  │
│  │ - auto_deploy           ││                                  │
│  └─────────────────────────┘│                                  │
│  ┌─────────────────────────┐│                                  │
│  │ admin_users             ││                                  │
│  │ - email                 ││                                  │
│  │ - password (hashed)     ││                                  │
│  │ - role                  ││                                  │
│  │ - ativo                 ││                                  │
│  └─────────────────────────┘│                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOY AUTOMÁTICO                           │
├─────────────────────────────────────────────────────────────────┤
│  Vercel API           │  Netlify API          │  Webhook Genérico│
│  - Deploy via API     │  - Deploy via API     │  - POST request  │
│  - Token auth         │  - Token auth         │  - Custom headers│
│  - Environment vars   │  - Environment vars   │  - JSON payload  │
└─────────────────────────────────────────────────────────────────┘
```

## Fluxo de Dados

### 1. **Criação de Credenciais**
```
Admin → AdminCredentialsManager → SecureCredentialsManager → Supabase Database
                                                         ↓
ClientEnvGenerator ← Supabase Storage ← .env gerado
```

### 2. **Deploy Automático**
```
Credenciais atualizadas → AutoDeploymentService → Serviço de Deploy (Vercel/Netlify)
                                                    ↓
Cliente recebe .env atualizado automaticamente
```

### 3. **Segurança**
```
Credenciais sensíveis → AES-256 Encryption → Supabase Database
                    ↓
Admin acessa → RLS Policy → Dados descriptografados → Interface
```

## Camadas de Segurança

### **1. Autenticação e Autorização**
- Login único para super admin
- JWT tokens para sessão
- RLS (Row Level Security) no Supabase
- Verificação de role em todas as operações

### **2. Criptografia de Dados**
- AES-256 para credenciais sensíveis
- Chave de criptografia configurável
- Dados nunca em texto plano
- Rotação de chaves suportada

### **3. Controle de Acesso**
- Apenas super admins podem gerenciar
- Políticas RLS por tabela
- Logs de auditoria completos
- Storage com acesso restrito

### **4. Validação e Sanitização**
- Validação de credenciais Google
- Sanitização de inputs
- Verificação de integridade
- Testes de conectividade

## Escalabilidade

### **Horizontal**
- Múltiplas instâncias do serviço
- Load balancer para distribuição
- Cache distribuído (Redis)
- CDN para arquivos estáticos

### **Vertical**
- Otimização de queries SQL
- Índices estratégicos
- Paginação de resultados
- Lazy loading de dados

### **Storage**
- Supabase Storage escalável
- Compressão de arquivos
- Limpeza automática
- Backup automático

## Monitoramento

### **Métricas**
- Número de clientes ativos
- Credenciais configuradas
- Deploys executados
- Erros e falhas

### **Logs**
- Operações de credenciais
- Deploys automáticos
- Acessos administrativos
- Erros e exceções

### **Alertas**
- Falhas de deploy
- Credenciais inválidas
- Acessos suspeitos
- Problemas de conectividade

## Integrações Futuras

### **Deploy**
- AWS CodeDeploy
- Google Cloud Build
- Azure DevOps
- GitHub Actions

### **Storage**
- AWS S3
- Google Cloud Storage
- Azure Blob Storage
- MinIO

### **Monitoramento**
- Datadog
- New Relic
- Sentry
- Grafana

---

**Esta arquitetura garante:**
- ✅ **Segurança máxima** para credenciais sensíveis
- ✅ **Escalabilidade** para centenas de clientes
- ✅ **Facilidade de uso** para administradores
- ✅ **Deploy automático** sem intervenção manual
- ✅ **Monitoramento completo** do sistema
