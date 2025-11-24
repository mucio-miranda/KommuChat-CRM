# Fix - Eventos de Dia Inteiro no Timezone Correto

## Problema
Eventos de dia inteiro (all-day events) do Google Calendar estavam aparecendo no dia anterior às 21h ao invés do dia correto.

## Causa Raiz
Eventos de dia inteiro no Google Calendar usam a propriedade `start.date` (formato: "YYYY-MM-DD") ao invés de `start.dateTime`.

Quando fazemos `new Date("2024-11-25")`, o JavaScript interpreta como **UTC midnight (00:00)**.
No timezone do Brasil (UTC-3), isso resulta em **21:00 do dia anterior** (24/11/2024 às 21:00).

### Exemplo do problema:
```javascript
// Evento no Google Calendar para 25/11/2024 (dia inteiro)
event.start.date = "2024-11-25"

// JavaScript interpreta como UTC
new Date("2024-11-25") 
// Resultado no Brasil (UTC-3): 24/11/2024 21:00 ❌
```

## Solução
Criada função helper `parseEventDate()` que:

1. **Detecta se é evento de dia inteiro** - verifica se tem `date` ou `dateTime`
2. **Para eventos com hora** - usa `new Date(dateTime)` normalmente
3. **Para eventos de dia inteiro** - cria a data no timezone local sem conversão UTC

```typescript
const parseEventDate = (start: { dateTime?: string; date?: string }): Date => {
  if (start.dateTime) {
    // Evento com hora específica - usar dateTime
    return new Date(start.dateTime);
  } else if (start.date) {
    // Evento de dia inteiro - interpretar no timezone local sem conversão UTC
    // start.date vem como "YYYY-MM-DD" (ex: "2024-11-25")
    const [year, month, day] = start.date.split('-').map(Number);
    return new Date(year, month - 1, day); // month é 0-indexed
  }
  return new Date();
};
```

### Como funciona:
```javascript
// Evento de dia inteiro para 25/11/2024
event.start.date = "2024-11-25"

// Solução: Criar data localmente
const [year, month, day] = "2024-11-25".split('-').map(Number);
// year = 2024, month = 11, day = 25

new Date(2024, 10, 25); // month é 0-indexed (10 = novembro)
// Resultado: 25/11/2024 00:00 no timezone local ✅
```

## Arquivos Modificados

### 1. `src/pages/Calendario.tsx`
- ✅ Adicionada função `parseEventDate()`
- ✅ Atualizado `convertGoogleEventsToAppointments()` - mostra "Dia inteiro" ao invés de hora
- ✅ Corrigido filtro `getAppointmentsForDay()`
- ✅ Corrigido filtro `getAppointmentsForDate()`
- ✅ Corrigida ordenação em `getAllFilteredAppointments`

### 2. `src/components/SearchConsultation.tsx`
- ✅ Adicionada função `parseEventDate()`
- ✅ Atualizado `getEventDate()` para usar a função helper

### 3. `src/components/CalendarPreview.tsx`
- ✅ Adicionada função `parseEventDate()`
- ✅ Atualizado filtro `todayEvents`
- ✅ Atualizado `formattedAppointments` - mostra "Dia inteiro" e ordena corretamente

### 4. `src/components/CreateEventModal.tsx`
- ✅ Adicionada função `parseEventDate()`
- ✅ Corrigido preenchimento do formulário em modo de edição
- ✅ Corrigida verificação de conflitos de horários

## Melhorias Adicionais

### 1. Display de Eventos de Dia Inteiro
Eventos all-day agora mostram **"Dia inteiro"** ao invés de "00:00" ou horário incorreto.

### 2. Ordenação de Eventos
Eventos de dia inteiro aparecem **primeiro** na lista do dia, seguidos por eventos com hora específica.

### 3. Conflitos de Horário
Verificação de conflitos agora funciona corretamente para eventos de dia inteiro.

## Como Testar

### Teste 1: Criar Evento de Dia Inteiro no Google Calendar
1. Abra o Google Calendar
2. Crie um evento marcando "Dia inteiro" (ex: "Clínica Fechada" para amanhã)
3. Volte ao CRM e clique em Refresh
4. ✅ Evento deve aparecer no dia correto com texto "Dia inteiro"

### Teste 2: Verificar Eventos Existentes
1. Identifique um evento de dia inteiro que estava aparecendo errado
2. Anote o dia em que deveria aparecer
3. Recarregue a página do calendário (F5)
4. ✅ Evento agora deve aparecer no dia correto

### Teste 3: Editar Evento de Dia Inteiro
1. Clique em um evento de dia inteiro no calendário
2. Modal de edição deve abrir com a data correta
3. ✅ Data mostrada deve corresponder ao dia do evento no Google Calendar

### Teste 4: Timezones Diferentes
Se você ou seus usuários estão em timezones diferentes:
1. Crie evento de dia inteiro no Google Calendar
2. ✅ Deve aparecer no mesmo dia em todos os timezones

## Tipos de Eventos

### Eventos com Hora Específica
```json
{
  "start": {
    "dateTime": "2024-11-25T14:30:00-03:00",
    "timeZone": "America/Sao_Paulo"
  }
}
```
- Exibe: "14:30"
- Comportamento: Já funcionava corretamente ✅

### Eventos de Dia Inteiro
```json
{
  "start": {
    "date": "2024-11-25"
  }
}
```
- Exibe: "Dia inteiro"
- Comportamento: **CORRIGIDO** ✅

## Validação

Execute este código no console do navegador para validar:

```javascript
// Teste 1: Evento de dia inteiro
const allDayEvent = { start: { date: "2024-11-25" } };
const parseEventDate = (start) => {
  if (start.dateTime) return new Date(start.dateTime);
  if (start.date) {
    const [year, month, day] = start.date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date();
};

const date = parseEventDate(allDayEvent.start);
console.log('Data corrigida:', date.toLocaleDateString('pt-BR'));
// Deve mostrar: "25/11/2024" ✅
console.log('Hora:', date.toLocaleTimeString('pt-BR'));
// Deve mostrar: "00:00:00" (meia-noite local) ✅
```

## Notas Técnicas

### Por que não usar `Date.parse()`?
`Date.parse("2024-11-25")` também interpreta como UTC, causando o mesmo problema.

### Por que não ajustar timezone após criar Date?
Ajustar timezone depois da criação é mais complexo e pode causar bugs com horário de verão.

### Solução escolhida
Criar a data diretamente no timezone local usando o construtor `new Date(year, month, day)` é:
- Mais simples
- Mais performático
- Mais confiável
- Funciona em todos os timezones

## Compatibilidade

✅ Funciona em todos os navegadores modernos
✅ Compatível com todos os timezones
✅ Não quebra eventos com hora específica
✅ Retrocompatível com eventos existentes

