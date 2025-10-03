# Fluxos n8n para CRM KOMMUchat

Este documento descreve os fluxos de automação recomendados para integração entre WhatsApp e o CRM KOMMUchat via n8n.

## 🔄 Fluxo 1: Recebimento de Mensagem WhatsApp

### Trigger
- **Webhook** recebendo mensagens do WhatsApp Business API

### Nodes
1. **Webhook** → Recebe mensagem
2. **IF** → Verifica se é mensagem de texto
3. **Supabase** → Busca paciente pelo número
4. **IF** → Paciente existe?
   - **Sim**: Atualiza conversa
   - **Não**: Cria novo paciente
5. **Supabase** → Insere/atualiza conversa
6. **Supabase** → Atualiza status do paciente

### Exemplo de Webhook
```json
{
  "entry": [{
    "id": "123456789",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "5511999999999",
          "phone_number_id": "987654321"
        },
        "contacts": [{
          "profile": {
            "name": "Nome do Paciente"
          },
          "wa_id": "5511999999999"
        }],
        "messages": [{
          "from": "5511999999999",
          "id": "wamid.123456789",
          "timestamp": "1234567890",
          "text": {
            "body": "Olá, gostaria de agendar uma consulta"
          },
          "type": "text"
        }]
      }
    }]
  }]
}
```

## 🔄 Fluxo 2: Envio de Mensagem Automática

### Trigger
- **Cron** → Executa a cada X minutos
- **Webhook** → Recebe solicitação de envio

### Nodes
1. **Supabase** → Busca mensagens pendentes
2. **Loop** → Para cada mensagem
3. **WhatsApp** → Envia mensagem
4. **Supabase** → Atualiza status da mensagem
5. **Supabase** → Atualiza último contato do paciente

## 🔄 Fluxo 3: Lembretes de Consulta

### Trigger
- **Cron** → Executa diariamente às 8h

### Nodes
1. **Supabase** → Busca consultas para hoje
2. **Loop** → Para cada consulta
3. **IF** → Precisa enviar lembrete?
4. **WhatsApp** → Envia lembrete
5. **Supabase** → Registra envio do lembrete

## 🔄 Fluxo 4: Atualização de Status

### Trigger
- **Webhook** → Recebe mudança de status

### Nodes
1. **Webhook** → Recebe dados
2. **Supabase** → Atualiza status do paciente
3. **IF** → Status mudou para "atende_humano"?
4. **Supabase** → Notifica funcionários disponíveis

## 📱 Exemplos de Mensagens

### Boas-vindas para Novo Paciente
```
Olá! 👋 

Bem-vindo à [Nome da Clínica]. 

Como posso ajudá-lo hoje?

1️⃣ Agendar consulta
2️⃣ Informações sobre tratamentos
3️⃣ Falar com atendente
4️⃣ Outros assuntos

Digite o número da opção desejada.
```

### Lembrete de Consulta
```
🔔 Lembrete de Consulta

Olá [Nome do Paciente]!

Sua consulta está agendada para:
📅 [Data]
⏰ [Horário]
👨‍⚕️ [Profissional]

📍 [Endereço da Clínica]

Para confirmar, responda:
✅ Confirmo
❌ Preciso remarcar
❓ Tenho dúvidas

Aguardamos sua confirmação!
```

### Follow-up
```
📞 Follow-up

Olá [Nome do Paciente]!

Como está se sentindo após sua consulta?

1️⃣ Muito bem, obrigado!
2️⃣ Bem, mas tenho algumas dúvidas
3️⃣ Preciso de mais orientações
4️⃣ Não estou me sentindo bem

Responda com o número da opção ou escreva sua mensagem.
```

## 🔧 Configuração do n8n

### Variáveis de Ambiente
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima
WHATSAPP_TOKEN=seu_token_whatsapp
WHATSAPP_PHONE_ID=seu_phone_id
```

### Credenciais Supabase
- **URL**: URL do seu projeto Supabase
- **API Key**: Chave anônima do Supabase
- **Database**: Nome do banco (geralmente 'postgres')

### Credenciais WhatsApp
- **Access Token**: Token de acesso da API do WhatsApp
- **Phone Number ID**: ID do número de telefone configurado
- **Business Account ID**: ID da conta empresarial

## 📊 Monitoramento

### Métricas Importantes
- **Taxa de entrega**: % de mensagens entregues
- **Tempo de resposta**: Tempo médio de resposta automática
- **Conversões**: % de pacientes que agendam consulta
- **Erros**: Falhas na integração ou envio

### Logs Recomendados
- Todas as mensagens recebidas/enviadas
- Erros de integração
- Mudanças de status
- Criação de novos pacientes

## 🚀 Próximos Passos

1. **Configurar webhooks** no WhatsApp Business
2. **Criar fluxos** no n8n seguindo os exemplos
3. **Testar integração** com dados de exemplo
4. **Monitorar performance** e ajustar conforme necessário
5. **Implementar fluxos avançados** (IA, personalização, etc.)

---

**Dica**: Comece com fluxos simples e vá adicionando complexidade gradualmente. Teste cada etapa antes de prosseguir.
