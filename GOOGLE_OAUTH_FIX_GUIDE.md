# 🔧 Guia para Corrigir Credenciais OAuth do Google

## 🚨 Problema Identificado
O cliente OAuth foi deletado no Google Cloud Console, causando o erro `deleted_client`.

## 📋 Solução Passo a Passo

### 1. Acesse o Google Cloud Console
- Vá para: https://console.cloud.google.com/apis/credentials
- Faça login com sua conta Google

### 2. Selecione o Projeto
- Selecione o projeto: `fantom-weblabs`
- Se não encontrar, verifique se está na organização correta

### 3. Crie um Novo Cliente OAuth 2.0
- Clique em "Criar Credenciais" > "ID do cliente OAuth 2.0"
- Configure:
  - **Tipo de aplicação**: Aplicação da Web
  - **Nome**: KommuChat CRM
  - **URIs de redirecionamento autorizados**:
    - `http://localhost:8080/auth/google/callback`
    - `http://localhost:8081/auth/google/callback`

### 4. Copie as Credenciais
- Anote o **Client ID** gerado
- Anote o **Client Secret** gerado

### 5. Atualize o Script
- Abra o arquivo `create-new-google-credentials.js`
- Substitua as linhas:
  ```javascript
  client_id: 'TEMP_CLIENT_ID_AQUI', // Substitua pelo novo Client ID
  client_secret: 'TEMP_CLIENT_SECRET_AQUI', // Substitua pelo novo Client Secret
  ```
- Pelo Client ID e Client Secret reais

### 6. Execute o Script
```bash
node create-new-google-credentials.js
```

### 7. Teste a Integração
- Acesse: http://localhost:8080
- Faça login com `muciohh@gmail.com`
- Vá para a página do calendário
- Clique em "Conectar Google Calendar"

## 🔍 Verificação
Se tudo estiver correto, você deve ver:
- ✅ URL de autorização gerada corretamente
- ✅ Redirecionamento para o Google funcionando
- ✅ Autorização sendo solicitada
- ✅ Retorno para a aplicação funcionando

## 🆘 Problemas Comuns

### Erro: "Cliente não encontrado"
- Verifique se o projeto correto está selecionado
- Confirme se as credenciais foram criadas corretamente

### Erro: "Redirect URI não autorizado"
- Verifique se os URIs estão exatamente como configurados
- Certifique-se de que não há espaços extras

### Erro: "Escopo não autorizado"
- Verifique se a API Google Calendar está habilitada
- Vá para: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com

## 📞 Suporte
Se precisar de ajuda, verifique:
1. Se o projeto Google Cloud está ativo
2. Se as APIs necessárias estão habilitadas
3. Se as credenciais foram copiadas corretamente
4. Se os URIs de redirecionamento estão corretos





