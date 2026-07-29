---
name: git-commit
description: Padrão de commits do projeto KommuChat CRM. Use SEMPRE que houver mudanças prontas para versionar — ao concluir uma task, um arquivo ou um bloco de trabalho coerente. O agente PROPÕE a mensagem no padrão definido, ESPERA o ok do usuário, commita localmente e NUNCA dá push (o push é sempre manual, feito pelo usuário). Acione mesmo que o usuário não peça "commita" explicitamente — sugerir o commit no momento certo é parte do fluxo.
---

# git-commit

Padrão de commits do KommuChat CRM. Garante histórico limpo, consistente e legível. Duas
regras de fluxo inegociáveis:

1. **Nunca dar `git push`.** O push é exclusivamente manual, feito pelo usuário.
2. **Sempre propor a mensagem e esperar o "ok"** antes de rodar `git commit`. Não commitar
   sem aprovação explícita.

## Fluxo

1. Quando houver mudanças prontas para versionar (task concluída, arquivo finalizado, bloco
   coerente de trabalho), proponha o commit — mesmo que o usuário não tenha pedido.
2. Verifique o que está em staging (`git status`, `git diff --staged`). Se nada estiver
   staged, mostre o que mudou e proponha o `git add` dos arquivos relevantes.
3. Apresente a **mensagem proposta** no padrão abaixo + a lista de arquivos que entram.
4. Pergunte explicitamente: **"Commito assim?"**
5. Só rode `git commit` após o "ok". Se o usuário ajustar a mensagem, incorpore antes.
6. **Nunca** rode `git push`. Se o usuário quiser publicar, lembre que o push é manual — e
   que o repositório tem uma única branch, `main` (sem branches de feature, sem PR).

## Estrutura da mensagem

```
[emoji] [tipo](escopo opcional): [mensagem curta em letras minúsculas]
```

O escopo é opcional, mas o histórico do projeto usa bastante — normalmente o módulo/tela
afetado: `pacientes`, `calendario`, `chat`/`whatsapp`, `header`, `admin`, `auth`.

| Emoji | Tipo | Quando usar |
|---|---|---|
| ✨ | feat | Nova funcionalidade (tela, componente, integração) |
| 🐛 | fix | Correção de bug ou erro |
| 📝 | docs | Só documentação (README, project.md, docs/) |
| 🎨 | style | Mudança visual sem alterar lógica (Tailwind, layout, cores, textos de UI) |
| ⚡ | perf | Mudança que melhora desempenho (ex.: reduzir campos de uma query) |
| ♻️ | refactor | Refatoração que não corrige bug nem cria feature |
| 🧪 | test | Adição ou modificação de testes |
| 🚀 | deploy | Deploy, Netlify, configuração de ambiente/infra |
| 🔒️ | security | Correção de vulnerabilidade, RLS, credenciais, criptografia |
| 🧹 | chore | Dependências, scripts utilitários, limpeza sem mudar lógica de produto |

Ajustes visuais simples (cor, espaçamento, texto de label) usam `🎨 style`.

## Contexto do projeto

Frontend na raiz do repositório (`vite_react_shadcn_ts`); `backend/` guarda o servidor
Node/Baileys legado (sem `package.json` próprio — ver `project.md`, seção 10). Commits que
mexem em `backend/` devem deixar isso claro na mensagem (ex. `chore(backend): ...`), já que
não é o caminho ativo de WhatsApp em produção.

Fluxo de branches: **tudo vai direto para `main`**, sem branch de feature, sem PR. Push é
sempre manual, feito pelo usuário — o agente nunca empurra para nenhuma branch.

## Boas práticas

- **Seja direto:** a mensagem diz *o que* foi feito, não *como*. Curta.
- **Imperativo/presente:** `fix: corrige duplicidade de telefone`, não `corrigido` nem
  `corrigindo`.
- **Um propósito por commit:** não misture `feat` com `fix`. Se o trabalho tem dois
  propósitos, proponha **dois commits separados** (staging seletivo com `git add <arquivos>`
  de cada grupo).
- **Minúsculas** na mensagem após o tipo/escopo.
- Não inclua assinatura de ferramenta ou agente na mensagem nem no corpo do commit.
- Não mencione número de task/ticket na mensagem — a mensagem descreve o trabalho.

## Exemplos no contexto do KommuChat CRM

```
✨ feat(pacientes): bloquear criação de paciente com telefone duplicado
✨ feat(pacientes): normalizar telefone para formato internacional ao salvar
✨ feat(pacientes): adicionar edição de paciente com modal
✨ feat(header): abrir modal de novo evento ao clicar em nova consulta estando no calendário
✨ feat(calendario): preencher nome do paciente automaticamente ao selecionar paciente no modal de novo evento
🐛 fix(calendario): limpar data_agendamento ao deletar evento com paciente auto-selecionado
🧹 chore: remover console.logs
🎨 style(chat): mudar texto "chat" para "whatsapp" na sidebar
📝 docs: atualizar readme com fluxo de instalação do backend
```

## Exemplo de proposta ao usuário

> Mudanças prontas para commit:
> - `src/components/CreateEventModal.tsx`, `src/components/DatePickerPopover.tsx`, `src/components/PatientCombobox.tsx`
>
> **Mensagem proposta:**
> `✨ feat(calendario): permitir busca de paciente por telefone no modal de evento`
>
> **Commito assim?** (lembrando: não dou push — isso fica com você)
