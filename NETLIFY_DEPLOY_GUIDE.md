# 🚀 Guia de Deploy no Netlify - CRM KOMMUCHAT

Este guia contém todas as instruções necessárias para fazer o deploy do seu CRM no Netlify.

## 📋 Pré-requisitos

1. **Conta no Netlify**: Crie uma conta gratuita em [netlify.com](https://netlify.com)
2. **Repositório no GitHub**: Certifique-se de que seu código está no GitHub
3. **Configurações do Supabase**: Tenha as URLs e chaves dos seus projetos Supabase
4. **Configurações do Google**: Tenha as credenciais do Google Calendar API

## 🔧 Configuração Inicial

### 1. Conectar Repositório ao Netlify

1. Acesse o [Netlify Dashboard](https://app.netlify.com)
2. Clique em **"New site from Git"**
3. Escolha **GitHub** como provedor
4. Selecione seu repositório `CRM-KOMMUCHAT`
5. Configure as seguintes opções:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18` (ou superior)

### 2. Configurar Variáveis de Ambiente

No painel do Netlify, vá para:
**Site Settings > Environment Variables**

Adicione todas as variáveis do arquivo `netlify-env-example.txt`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
VITE_CRM_SUPABASE_URL=https://seu-projeto-crm.supabase.co
VITE_CRM_SUPABASE_ANON_KEY=sua_chave_anonima_crm_aqui

# Google Calendar API
VITE_GOOGLE_CLIENT_ID=seu_google_client_id
VITE_GOOGLE_CLIENT_SECRET=seu_google_client_secret
VITE_GOOGLE_REDIRECT_URI=https://seu-dominio.netlify.app/auth/google/callback

# Encryption
VITE_ENCRYPTION_KEY=sua_chave_criptografia_256_bits

# App Configuration
VITE_APP_NAME=KOMMUchat CRM
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
```

## ⚙️ Configurações Importantes

### 1. Google OAuth Redirect URI

**CRÍTICO**: Após o deploy, você precisa atualizar o redirect URI no Google Console:

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Vá para **APIs & Services > Credentials**
3. Edite seu OAuth 2.0 Client ID
4. Adicione a nova URL: `https://seu-dominio.netlify.app/auth/google/callback`
5. Salve as alterações

### 2. Configurações do Supabase

Certifique-se de que:

1. **RLS (Row Level Security)** está configurado corretamente
2. **Políticas de acesso** permitem acesso público onde necessário
3. **CORS** está configurado para permitir seu domínio Netlify

### 3. Configurações de Domínio (Opcional)

Se você quiser usar um domínio customizado:

1. No Netlify: **Site Settings > Domain Management**
2. Adicione seu domínio customizado
3. Configure os DNS records conforme instruído
4. Atualize as variáveis de ambiente com o novo domínio

## 🔄 Processo de Deploy

### Deploy Automático (Recomendado)

1. **Push para GitHub**: Faça push das suas alterações para a branch `main`
2. **Deploy Automático**: O Netlify detectará as mudanças e fará o deploy automaticamente
3. **Monitoramento**: Acompanhe o processo na aba **Deploys**

### Deploy Manual

1. No Netlify Dashboard, clique em **"Deploy site"**
2. Escolha **"Deploy manually"**
3. Arraste a pasta `dist` (após executar `npm run build`)

## 🧪 Testando o Deploy

Após o deploy, teste:

1. **Acesso básico**: Acesse a URL fornecida pelo Netlify
2. **Autenticação**: Teste login/logout
3. **Integração Google**: Teste o login com Google
4. **Funcionalidades**: Teste as principais funcionalidades do CRM
5. **Performance**: Verifique se a aplicação carrega rapidamente

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. Erro 404 em rotas
**Solução**: Verifique se o arquivo `netlify.toml` está presente e configurado corretamente.

#### 2. Variáveis de ambiente não funcionam
**Solução**: 
- Certifique-se de que as variáveis começam com `VITE_`
- Verifique se não há espaços extras nos valores
- Faça um novo deploy após alterar as variáveis

#### 3. Erro de CORS
**Solução**: 
- Adicione o domínio Netlify nas configurações do Supabase
- Verifique as políticas de RLS

#### 4. Google OAuth não funciona
**Solução**:
- Atualize o redirect URI no Google Console
- Verifique se `VITE_GOOGLE_CLIENT_ID` está correto
- Certifique-se de que o domínio está autorizado

### Logs de Deploy

Para debug, verifique:
1. **Build logs**: Netlify Dashboard > Deploys > [Deploy específico]
2. **Function logs**: Se usando Netlify Functions
3. **Browser console**: Para erros de runtime

## 📊 Monitoramento

### Performance

O Netlify oferece métricas básicas:
- **Page load time**
- **Bandwidth usage**
- **Build time**

### Analytics (Opcional)

Para analytics mais detalhados:
1. Configure o **Netlify Analytics** (plano pago)
2. Ou integre com **Google Analytics**

## 🔒 Segurança

### Configurações de Segurança

O arquivo `netlify.toml` já inclui headers de segurança:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Variáveis Sensíveis

- **Nunca** commite arquivos `.env` com dados reais
- Use apenas as variáveis de ambiente do Netlify
- Revise periodicamente as permissões de acesso

## 🚀 Próximos Passos

Após o deploy bem-sucedido:

1. **Configurar domínio customizado** (se necessário)
2. **Configurar SSL** (automático no Netlify)
3. **Configurar backup automático**
4. **Monitorar performance**
5. **Configurar CI/CD** para deploys automáticos

## 📞 Suporte

Se encontrar problemas:

1. Verifique os [logs de build](https://docs.netlify.com/site-deploys/overview/)
2. Consulte a [documentação do Netlify](https://docs.netlify.com/)
3. Verifique a [documentação do Vite](https://vitejs.dev/guide/)

---

**🎉 Parabéns!** Seu CRM KOMMUCHAT está agora online e acessível para seus usuários!
