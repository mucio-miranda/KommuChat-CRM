# Debug - Eventos do Google Calendar

## Problema Identificado
Alguns eventos do Google Calendar não estavam sendo exibidos no CRM.

## Causas Identificadas e Corrigidas

### 1. ✅ Período de Busca Limitado
**Antes:** Buscava apenas 1 ano atrás e 6 meses à frente
**Depois:** Busca 2 anos atrás e 1 ano à frente

### 2. ✅ Limite de Eventos por Calendário
**Antes:** Máximo de 100 eventos por calendário
**Depois:** Máximo de 250 eventos por calendário

### 3. ✅ Filtro de Calendários Selecionados
**Problema:** Se você selecionava apenas alguns calendários, eventos de outros calendários não apareciam
**Solução:** Agora mostra TODOS os eventos por padrão, mas permite filtrar se desejar

### 4. ✅ Logs Detalhados Adicionados
Agora o console mostra:
- Quantos calendários foram encontrados
- Quantos eventos foram encontrados em cada calendário
- Total de eventos carregados
- Eventos por calendário (agrupado)
- Primeiros 3 eventos de cada calendário (para verificação)

## Como Verificar se os Eventos Estão Aparecendo

### 1. Abra o Console do Navegador
- Chrome/Edge: `F12` ou `Ctrl+Shift+I`
- Firefox: `F12` ou `Ctrl+Shift+K`

### 2. Recarregue o Calendário
- Clique no botão de **Refresh** (ícone circular vermelho)
- Ou pressione `F5` na página do calendário

### 3. Verifique os Logs

Você verá algo assim:

```
🔍 Buscando eventos de TODAS as agendas do Google Calendar...
📅 Encontradas 3 agendas:
  - Meu Calendário (primary) - Selecionada: true
  - Agenda da Clínica (abc123@group.calendar.google.com) - Selecionada: true
  - Feriados no Brasil (pt.brazilian#holiday@group.v.calendar.google.com) - Selecionada: true
📅 Período de busca ampliado: 2023-11-24 até 2026-11-24

🔍 Buscando eventos da agenda: Meu Calendário (primary)...
📊 Agenda "Meu Calendário": 45 eventos encontrados
📋 Primeiros eventos de "Meu Calendário":
  - Consulta Dr. Silva (2024-11-25T10:00:00-03:00)
  - Retorno Paciente X (2024-11-26T14:30:00-03:00)
  - Primeira Consulta (2024-11-27T09:00:00-03:00)
✅ 45 eventos processados da agenda: Meu Calendário

[...mais agendas...]

========== RESUMO DA BUSCA ==========
📅 Total de calendários verificados: 3
📊 Total de eventos encontrados: 127
📅 Período: 24/11/2023 até 24/11/2026
=======================================

📅 Total de eventos recebidos de todas as agendas: 127
📊 Eventos por calendário:
  - Meu Calendário (primary): 45
  - Agenda da Clínica (abc123@group.calendar.google.com): 78
  - Feriados no Brasil (pt.brazilian#holiday@group.v.calendar.google.com): 4
📅 Sem filtro ativo - mostrando TODOS os eventos
```

## Checklist de Verificação

- [ ] Vejo o log "Buscando eventos de TODAS as agendas"?
- [ ] Todos os meus calendários aparecem na lista?
- [ ] O número total de eventos está correto?
- [ ] Os eventos que faltavam agora aparecem no calendário?

## Possíveis Problemas e Soluções

### Problema: Ainda faltam eventos

**Possíveis causas:**

1. **Eventos estão fora do período de busca (2 anos atrás até 1 ano à frente)**
   - Solução: Eventos muito antigos ou muito futuros não serão buscados

2. **Mais de 250 eventos em um único calendário**
   - Solução: Você verá no log "250 eventos encontrados" - limite máximo
   - Ação: Podemos aumentar esse limite se necessário

3. **Calendário não está na lista de calendários**
   - Solução: Verifique se o calendário está visível no Google Calendar
   - Ação: Vá em Configurações > Agendas e verifique se está ativo

4. **Eventos privados ou com acesso restrito**
   - Solução: Verifique as permissões do calendário no Google

### Problema: Eventos duplicados

**Causa:** Eventos recorrentes são expandidos
**Solução:** O código já remove duplicatas baseado no ID do evento

### Problema: Performance lenta

**Causa:** Muitos eventos sendo carregados
**Solução:** 
- O carregamento é feito em paralelo para todas as agendas
- Cache de eventos é mantido até o próximo refresh

## Filtro de Calendários (Opcional)

Se você quiser filtrar por calendários específicos:

1. No componente `CalendarAgendasList`, selecione os calendários desejados
2. Apenas eventos dos calendários selecionados serão exibidos
3. Para ver todos novamente, desmarque todos os calendários

## Suporte

Se o problema persistir:
1. Tire uma captura de tela dos logs do console
2. Anote quais eventos específicos estão faltando
3. Verifique se esses eventos aparecem no Google Calendar web

