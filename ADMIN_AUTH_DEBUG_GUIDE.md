# Guia de Debug - Autenticação Admin KOMMUchat

## 🔍 Status do Sistema

✅ **Backend funcionando perfeitamente**
- Tabela `admin_users` criada
- Funções SQL implementadas
- Usuário admin configurado
- Testes de conexão passando

❓ **Frontend - Necessário testar**

## 🧪 Como Testar o Sistema

### 1. **Teste Backend (Já funcionando)**
```bash
node test-admin-auth.js
```
**Resultado esperado**: Todos os testes passando ✅

### 2. **Teste Frontend - Login Admin**
1. Acesse `/admin/login`
2. Use as credenciais:
   - **Username**: `kommuchat.admin`
   - **Senha**: `I'g6kvTzWeE{,b.qPZ7)+B_}qZ6;08[BAKc]>tH=84.O.$w,79`

### 3. **Debug no Console do Navegador**
Abra o DevTools (F12) e verifique os logs:

**Logs esperados:**
```
🔍 CRM Supabase Config - URL: https://wywzdtyjzzmcehrsalvn.supabase.co
🔍 CRM Supabase Config - Key presente: true
🔍 AdminAuth - Iniciando processo de login...
🔍 AdminAuth - Username: kommuchat.admin
🔍 AdminAuth - SupabaseCrm disponível: true
🔍 AdminAuth - Buscando usuário admin...
🔍 AdminAuth - Resultado da busca: {adminData: {...}, fetchError: null}
🔍 AdminAuth - Verificando senha...
🔍 AdminAuth - Resultado da verificação: {passwordValid: true, passwordError: null}
✅ AdminAuth - Login realizado com sucesso: kommuchat.admin
```

## 🐛 Possíveis Problemas e Soluções

### **Problema 1: "Supabase CRM client não está inicializado"**
**Causa**: Variáveis de ambiente não carregadas
**Solução**: 
- Verificar se arquivo `.env` existe
- Verificar se contém `VITE_CRM_SUPABASE_URL` e `VITE_CRM_SUPABASE_ANON_KEY`
- Reiniciar servidor de desenvolvimento

### **Problema 2: "Usuário admin não encontrado"**
**Causa**: Tabela não criada ou usuário não inserido
**Solução**:
- Executar script SQL `create-admin-users-table.sql`
- Verificar se usuário `kommuchat.admin` existe na tabela

### **Problema 3: "Erro na verificação de senha"**
**Causa**: Função SQL não criada
**Solução**:
- Executar script SQL completo
- Verificar se função `verify_admin_password` existe

### **Problema 4: "Senha incorreta" (RESOLVIDO ✅)**
**Causa**: Hash da senha incorreto no banco de dados
**Solução**: 
- ✅ **CORRIGIDO**: Hash da senha foi regenerado e atualizado
- ✅ **TESTADO**: Senha funcionando corretamente
- Usar exatamente: `I'g6kvTzWeE{,b.qPZ7)+B_}qZ6;08[BAKc]>tH=84.O.$w,79`

## 🔧 Arquivos de Debug Criados

1. **`test-admin-auth.js`** - Teste completo do backend
2. **`test-admin-login.html`** - Teste visual do frontend
3. **`debug-admin-auth.html`** - Verificação de variáveis de ambiente

## 📋 Checklist de Verificação

- [ ] Arquivo `.env` existe e está configurado
- [ ] Variáveis `VITE_CRM_SUPABASE_URL` e `VITE_CRM_SUPABASE_ANON_KEY` definidas
- [ ] Tabela `admin_users` criada no Supabase
- [ ] Usuário `kommuchat.admin` existe na tabela
- [ ] Funções SQL criadas (`verify_admin_password`, etc.)
- [ ] Servidor de desenvolvimento reiniciado
- [ ] Console do navegador sem erros
- [ ] Logs de debug aparecendo no console

## 🚀 Próximos Passos

1. **Testar login** em `/admin/login`
2. **Verificar logs** no console do navegador
3. **Reportar erros específicos** se houver
4. **Confirmar redirecionamento** para `/admin/dashboard`

## 📞 Credenciais de Teste

```
Username: kommuchat.admin
Senha: I'g6kvTzWeE{,b.qPZ7)+B_}qZ6;08[BAKc]>tH=84.O.$w,79
```

**⚠️ IMPORTANTE**: Esta senha é para teste. Em produção, use uma senha mais segura.
