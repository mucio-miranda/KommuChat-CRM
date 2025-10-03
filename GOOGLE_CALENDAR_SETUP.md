# Configuração do Google Calendar API

Este documento explica como configurar a integração com o Google Calendar para a aplicação CRM KOMMUchat.

## 1. Criar Projeto no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um projeto existente
3. Ative a Google Calendar API:
   - Vá para "APIs & Services" > "Library"
   - Procure por "Google Calendar API"
   - Clique em "Enable"

## 2. Configurar OAuth 2.0

1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure o tipo de aplicação como "Web application"
4. Adicione as URIs de redirecionamento:
   - Para desenvolvimento: `http://localhost:8080/auth/google/callback`
   - Para produção: `https://seudominio.com/auth/google/callback`

## 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Google Calendar API Configuration
VITE_GOOGLE_CLIENT_ID=seu_client_id_aqui
VITE_GOOGLE_REDIRECT_URI=http://localhost:8081/auth/google/callback
```

**Importante:** Para aplicações frontend (SPA), não é necessário o `client_secret`. O fluxo OAuth usa PKCE (Proof Key for Code Exchange) para segurança.

## 4. Configuração para Conta fantom.weblabs@gmail.com

Para conectar especificamente com a conta `fantom.weblabs@gmail.com`:

1. **Certifique-se de que a conta tem acesso ao projeto:**
   - No Google Cloud Console, vá para "IAM & Admin" > "IAM"
   - Adicione `fantom.weblabs@gmail.com` como membro do projeto
   - Atribua a role "Editor" ou "Viewer" conforme necessário

2. **Configure o OAuth consent screen:**
   - Vá para "APIs & Services" > "OAuth consent screen"
   - Adicione `fantom.weblabs@gmail.com` como usuário de teste
   - Configure os escopos necessários:
     - `https://www.googleapis.com/auth/calendar.readonly`
     - `https://www.googleapis.com/auth/calendar.events`

3. **IMPORTANTE - Resolver erro "OAuth client was not found":**
   - Certifique-se de que o Client ID está correto no arquivo `.env`
   - Verifique se o redirect URI está exatamente: `http://localhost:8080/auth/google/callback`
   - Se ainda houver erro, crie um novo OAuth 2.0 Client ID

## 5. Testando a Integração

1. Inicie a aplicação: `npm run dev`
2. Acesse a página do calendário
3. Clique em "Conectar Google Calendar"
4. Faça login com a conta `fantom.weblabs@gmail.com`
5. Autorize o acesso aos dados do calendário
6. Verifique se os eventos aparecem no calendário da aplicação

## 6. Funcionalidades Disponíveis

- **Visualização de eventos**: Eventos do Google Calendar são exibidos no calendário da aplicação
- **Sincronização automática**: Eventos são carregados automaticamente ao conectar
- **Atualização manual**: Botão para recarregar eventos
- **Desconexão**: Opção para desconectar a conta Google

## 7. Solução de Problemas

### Erro "Access blocked"
- Verifique se a conta está adicionada como usuário de teste no OAuth consent screen
- Certifique-se de que o domínio está configurado corretamente

### Erro "Invalid redirect URI"
- Verifique se a URI de redirecionamento está exatamente igual à configurada no Google Cloud Console
- Certifique-se de que não há espaços extras ou caracteres especiais

### Eventos não aparecem
- Verifique se a Google Calendar API está ativada
- Confirme se os escopos corretos foram solicitados
- Verifique se há eventos no calendário da conta Google

## 8. Segurança

- **Nunca commite** o arquivo `.env` com as credenciais reais
- Use variáveis de ambiente diferentes para desenvolvimento e produção
- Revogue as credenciais se suspeitar de uso indevido
- Configure domínios autorizados no Google Cloud Console

## 9. Próximos Passos

Após a configuração básica, você pode:
- Implementar criação de eventos
- Sincronizar eventos bidirecionalmente
- Adicionar notificações de eventos
- Implementar filtros por tipo de evento
