# Feature - Deletar Evento do Calendário

## Funcionalidade Adicionada
Botão para deletar eventos do Google Calendar diretamente pelo modal de edição, com confirmação de segurança.

## Como Usar

### 1. Abrir Modal de Edição
- Na página `/calendario`, clique em qualquer evento existente
- O modal de edição será aberto com os dados do evento

### 2. Deletar Evento
1. No modal de edição, localize o botão **"Deletar Evento"** (vermelho) no canto inferior esquerdo
2. Clique no botão "Deletar Evento"
3. Uma confirmação aparecerá: **"Confirmar exclusão?"**
4. Clique em **"Sim, deletar"** para confirmar ou **"Cancelar"** para desistir
5. O evento será removido do Google Calendar e do CRM

## Design de Segurança

### Zona Segura
O botão de deletar está posicionado em uma **"zona segura"**:
- ✅ Separado dos botões de ação principal (Cancelar/Salvar)
- ✅ Posicionado no canto inferior esquerdo
- ✅ Cor vermelha para indicar ação destrutiva
- ✅ Requer confirmação explícita antes de executar

### Confirmação em Duas Etapas

**Passo 1 - Botão Inicial:**
```
┌─────────────────────────────────────────────────────────┐
│ [🗑️ Deletar Evento]        [Cancelar] [Salvar Alterações] │
└─────────────────────────────────────────────────────────┘
```

**Passo 2 - Confirmação:**
```
┌──────────────────────────────────────────────────────────┐
│ Confirmar exclusão? [Sim, deletar] [Cancelar]             │
│                                    [Cancelar] [Salvar]     │
└──────────────────────────────────────────────────────────┘
```

### Proteções Implementadas

1. **Visibilidade Condicional**
   - Botão só aparece no modo de edição (não no modo de criação)
   - Requer que um evento válido esteja selecionado

2. **Confirmação Explícita**
   - Primeiro clique: mostra confirmação
   - Segundo clique: executa ação
   - Opção de cancelar a qualquer momento

3. **Estados de Loading**
   - Botão desabilitado durante operação
   - Previne cliques múltiplos acidentais

4. **Feedback Visual**
   - Cores de alerta (vermelho)
   - Texto claro sobre a ação
   - Mensagens de sucesso/erro via toast

## Fluxo Técnico

### 1. Estado Inicial
```typescript
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
```

### 2. Primeiro Clique
```typescript
onClick={() => setShowDeleteConfirm(true)}
// Mostra: "Confirmar exclusão?"
```

### 3. Confirmação
```typescript
const handleDelete = async () => {
  // 1. Deletar do Google Calendar
  await deleteEvent(selectedEvent.id, calendarId);
  
  // 2. Mostrar feedback
  toast({ title: "Evento deletado!" });
  
  // 3. Fechar modal e atualizar lista
  handleClose();
  onEventCreated?.();
};
```

### 4. Cancelamento
```typescript
onClick={() => setShowDeleteConfirm(false)}
// Volta ao estado inicial
```

## Integração com Google Calendar

O evento é deletado permanentemente do Google Calendar via API:

```typescript
await deleteEvent(
  selectedEvent.id,           // ID do evento
  selectedEvent.calendarId    // ID do calendário (default: 'primary')
);
```

### Sincronização
- ✅ Evento removido do Google Calendar
- ✅ Calendário do CRM atualizado automaticamente
- ✅ Mudanças refletidas em todas as visualizações

## Mensagens de Feedback

### Sucesso
```
✅ Evento deletado!
O evento foi removido com sucesso do calendário.
```

### Erro
```
❌ Erro ao deletar evento
[Mensagem de erro específica]
```

## Casos de Uso

### 1. Cancelamento de Consulta
- Paciente cancelou → Deletar evento do calendário

### 2. Evento Duplicado
- Evento criado por engano → Remover duplicata

### 3. Reagendamento
- Deletar evento antigo → Criar novo no horário correto

### 4. Evento Incorreto
- Informações erradas → Deletar e recriar

## Código de Exemplo

### Estrutura do Botão
```tsx
{modalMode === 'edit' && selectedEvent && (
  <div className="flex gap-2">
    {!showDeleteConfirm ? (
      <Button
        variant="outline"
        onClick={() => setShowDeleteConfirm(true)}
        className="border-red-200 text-red-600 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Deletar Evento
      </Button>
    ) : (
      <div className="flex gap-2 items-center">
        <span className="text-sm text-red-600 font-medium">
          Confirmar exclusão?
        </span>
        <Button variant="destructive" onClick={handleDelete}>
          Sim, deletar
        </Button>
        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
          Cancelar
        </Button>
      </div>
    )}
  </div>
)}
```

## Melhorias Futuras (Possíveis)

1. **Soft Delete**
   - Mover para "lixeira" antes de deletar permanentemente
   - Permitir restauração dentro de X dias

2. **Notificação aos Participantes**
   - Enviar email automático informando cancelamento

3. **Histórico de Deleções**
   - Registrar quem deletou e quando
   - Auditoria de operações

4. **Confirmação por Senha**
   - Para eventos muito importantes
   - Camada extra de segurança

## Testes Recomendados

### Teste 1: Deletar Evento Simples
1. Abrir evento existente
2. Clicar em "Deletar Evento"
3. Confirmar deleção
4. ✅ Verificar que evento sumiu do calendário

### Teste 2: Cancelar Deleção
1. Abrir evento existente
2. Clicar em "Deletar Evento"
3. Clicar em "Cancelar"
4. ✅ Verificar que evento ainda existe

### Teste 3: Deleção Durante Loading
1. Abrir evento existente
2. Clicar em "Deletar Evento"
3. Confirmar rapidamente múltiplas vezes
4. ✅ Verificar que apenas uma requisição é enviada

### Teste 4: Erro na Deleção
1. Desconectar internet
2. Tentar deletar evento
3. ✅ Verificar mensagem de erro apropriada

## Segurança

### Validações
- ✅ Verifica se está em modo de edição
- ✅ Verifica se evento existe
- ✅ Requer confirmação explícita
- ✅ Desabilita durante operação

### Permissões
- Usa as mesmas credenciais do Google Calendar
- Requer permissão de escrita no calendário
- Respeita políticas de acesso do Google

## Notas de Implementação

- **Arquivo:** `src/components/CreateEventModal.tsx`
- **Hook usado:** `useGoogleCalendar().deleteEvent`
- **Componentes:** Button (variants: outline, destructive)
- **Ícone:** Trash2 (lucide-react)
- **Toast:** useToast para feedback

