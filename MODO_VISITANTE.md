# 🎭 Modo Visitante - CRM KOMMUchat

## 📋 **O que é o Modo Visitante?**

O **Modo Visitante** é um acesso temporário ao CRM KOMMUchat que permite visualizar e testar todas as funcionalidades do sistema usando dados simulados, sem necessidade de configurar o Supabase ou criar contas reais.

## 🚀 **Como Acessar**

1. **Acesse**: http://localhost:8085/ (ou a porta que estiver rodando)
2. **Na página de login**: Clique no botão **"Acessar como Visitante"**
3. **Pronto!**: Você será redirecionado para o dashboard com dados simulados

## ✨ **Funcionalidades Disponíveis**

### ✅ **Dashboard Completo**
- Métricas simuladas (pacientes, consultas, conversas)
- Tabela de contatos recentes
- Ações rápidas (nova conversa, agendar consulta, novo paciente)

### ✅ **Navegação Completa**
- Sidebar funcional
- Todas as páginas acessíveis
- Layout responsivo

### ✅ **Dados Simulados**
- 247 pacientes ativos
- 18 consultas para hoje
- 67 conversas WhatsApp
- Histórico de contatos

## 🔍 **Indicadores Visuais**

### **Badge "Visitante"**
- Aparece no header ao lado do nome
- Indica que está no modo demo

### **Alerta Azul**
- Informa que está visualizando dados simulados
- Explica como configurar dados reais

### **Card de Informações**
- Lista os passos para configuração real
- Botões para documentação e configuração

## 🗑️ **Como Remover (Quando Não Precisar Mais)**

### **1. Remover do AuthContext**
```typescript
// Em src/contexts/AuthContext.tsx
// Remover as linhas:
// - isVisitor: boolean
// - signInAsVisitor: () => void
// - const [isVisitor, setIsVisitor] = useState(false)
// - const visitorUser = { ... }
// - const signInAsVisitor = () => { ... }
```

### **2. Remover da Página de Login**
```typescript
// Em src/pages/Login.tsx
// Remover:
// - Botão "Acessar como Visitante"
// - Separador "ou"
// - Alerta amarelo sobre modo visitante
```

### **3. Remover do Layout**
```typescript
// Em src/components/Layout.tsx
// Remover:
// - Badge "Visitante" no header
// - Badge "Modo Demo" no dropdown
```

### **4. Remover do Dashboard**
```typescript
// Em src/pages/Dashboard.tsx
// Remover:
// - Alerta para visitantes
// - Card de informações para visitantes
```

### **5. Limpar Imports**
```typescript
// Remover imports não utilizados:
// - Eye, AlertCircle (se não estiverem sendo usados em outros lugares)
```

## 🎯 **Uso Recomendado**

### **Para Demonstrações**
- Apresentações para clientes
- Testes de funcionalidades
- Validação de design e UX

### **Para Desenvolvimento**
- Testar componentes sem banco
- Validar fluxos de navegação
- Verificar responsividade

### **Para Treinamentos**
- Mostrar funcionalidades para equipe
- Treinar usuários finais
- Documentar processos

## ⚠️ **Limitações do Modo Visitante**

- **Dados estáticos**: Não há persistência ou atualizações em tempo real
- **Sem integração**: WhatsApp e n8n não funcionam
- **Sem autenticação real**: Não testa fluxos de login/logout
- **Sem banco**: Não testa operações CRUD reais

## 🔄 **Transição para Produção**

Quando estiver pronto para usar dados reais:

1. **Configure o Supabase**
   - Execute `supabase-schema.sql`
   - Configure variáveis de ambiente

2. **Crie usuários reais**
   - Use o painel do Supabase
   - Configure autenticação

3. **Teste integração**
   - Configure n8n
   - Teste webhooks do WhatsApp

4. **Remova modo visitante**
   - Siga as instruções de remoção acima
   - Teste login real

## 📝 **Notas Importantes**

- **Temporário**: Este modo é apenas para desenvolvimento/demo
- **Não para produção**: Nunca deixe ativo em ambiente de produção
- **Fácil remoção**: Todas as funcionalidades são modulares
- **Dados seguros**: Não há risco de vazamento de dados reais

---

**🎭 Modo Visitante ativo até: [Data de remoção planejada]**
