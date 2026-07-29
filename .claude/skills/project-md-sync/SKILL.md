---
name: project-md-sync
description: Mantém o project.md (raiz do repositório) como fonte única de verdade do KommuChat CRM. Use SEMPRE no início de qualquer task de desenvolvimento, refatoração, decisão técnica ou dúvida de arquitetura/stack/domínio (pacientes, status derivado, dois projetos Supabase, autenticação custom, integração Evolution API/Google Calendar, multi-tenant) — leia o project.md antes de agir. Use TAMBÉM sempre que uma decisão, dependência, estrutura, fluxo ou regra de negócio mudar durante o trabalho: proponha a atualização do project.md e só aplique após aprovação explícita do usuário. Acione mesmo que a task não mencione documentação — manter o project.md fiel ao código é parte de toda entrega.
---

# project-md-sync

O `project.md` (na raiz do repositório) é a **fonte única de verdade** do KommuChat CRM:
visão geral do produto, stack, arquitetura dos dois projetos Supabase, autenticação
customizada, regras de derivação de status do paciente, integrações (Evolution API, Google
Calendar), painel de super-admin e pontos em aberto conhecidos. Esta skill garante duas
coisas: que toda decisão **leia** o project.md antes de agir, e que ele **permaneça fiel**
ao código — sempre com aprovação do usuário antes de qualquer alteração.

## Regra 1 — Ler antes de agir

No início de qualquer task técnica (criar feature, refatorar, mexer em pacientes,
calendário, chat/WhatsApp, autenticação, multi-tenant, configurar integração, decidir
lib/dependência):

1. Leia o `project.md` na raiz do projeto.
2. Use-o como contexto autoritativo — em especial os pontos não óbvios pelo código sozinho:
   - status do paciente é **derivado** (`getPatientStatus()`), não uma coluna;
   - `read` (Supabase "pacientes") vs. `write`/`config` (Supabase "CRM") têm papéis fixos;
   - autenticação **não** usa Supabase Auth (RPC de senha + localStorage);
   - WhatsApp em produção é via Evolution API, não via `backend/server.js` (Baileys);
   - a tabela de pacientes é dinâmica por tenant (`configuracoes_cliente.tabela_supabase`,
     padrão `kommuchat_mvp`).
3. Se a task pedir algo que **contradiz** o project.md (ex.: adicionar coluna `status` na
   tabela de pacientes quando o valor é derivado; gravar usuário/cliente no Supabase
   "pacientes"; reativar `backend/server.js` como se fosse o fluxo real de WhatsApp),
   **pare e sinalize** antes de seguir — não improvise nem assuma que o documento está errado.
4. Se a informação necessária não estiver no project.md, siga com a melhor decisão alinhada
   ao que já está documentado e registre que isso é candidato a virar entrada nova (ver
   Regra 2).

## Regra 2 — Atualizar com aprovação

O project.md deve refletir a realidade do código. Sempre que, durante uma task, algo
**mudar ou for definido**, proponha a atualização — **nunca edite sem aprovação**.

**Gatilhos de atualização** (não exaustivo):
- Nova dependência adicionada ou removida (e o porquê).
- Mudança de stack, versão major, ferramenta ou abordagem.
- Nova pasta/arquivo estrutural, ou mudança no papel de um arquivo existente
  (ex.: qual implementação de Google Calendar está de fato ativa).
- Novo fluxo (auth, WhatsApp, sincronização com Google Calendar) ou alteração em um existente.
- Nova regra de derivação/status de paciente, novo campo relevante na tabela dinâmica, ou
  mudança de como `fonte` (`ia`/`humano`) é calculada.
- Nova tabela/coluna no Supabase "pacientes" ou "CRM" usada pelo frontend.
- Resolução de um item da seção "Pontos em aberto" (ex.: confirmar se `backend/server.js`
  ainda está em uso, ou remover implementações legadas de Google Calendar).

**Fluxo de aprovação:**
1. Ao detectar um gatilho, **não edite ainda**. Apresente a proposta assim:
   - **Seção afetada** do project.md (ex.: "4. Dados — dois projetos Supabase", "7. Integrações externas").
   - **O que muda** — em um diff curto ou antes/depois objetivo.
   - **Motivo** — uma linha.
2. Pergunte explicitamente: **"Aplico essa atualização no project.md?"**
3. Aplique **somente** após o "sim". Se o usuário ajustar a proposta, incorpore o ajuste
   antes de gravar.
4. Faça a menor edição possível que mantenha o documento coerente — não reescreva seções
   inteiras sem necessidade.

## O que NÃO fazer
- Não editar o project.md silenciosamente, "de passagem", junto com outra mudança.
- Não duplicar informação que já existe — atualize no lugar certo.
- Não inflar o documento com detalhes de implementação efêmeros (nomes de variáveis locais,
  trechos de código). O project.md descreve **decisões, arquitetura e regras de negócio**,
  não cada linha.
- Não remover contexto de domínio (derivação de status, papéis dos dois Supabase, fluxo de
  autenticação) sem que o código realmente tenha mudado.

## Forma das propostas
Mantenha o estilo do documento: tabelas para stack/dados/rotas, prosa curta para fluxos,
pt-BR, blocos de código para lógica de derivação. Ao propor, mostre só o trecho que muda —
não cole o arquivo inteiro.

## Exemplo

> Durante uma task em `Pacientes.tsx`, percebi que a lógica de `getPatientStatus()` ganhou
> um novo caso: pacientes com `atende_humano = "true"` agora entram como `followup` mesmo
> sem `followup`/`follow` setados.
>
> **Proposta de atualização do project.md** — Seção 4 (Status do paciente é derivado):
> Adicionar ao bloco de derivação: `atende_humano = true → "followup"` (antes do fallback
> "novo"), com a mesma ressalva de que o valor chega como string do banco.
> Motivo: nova regra de negócio introduzida nesta task, precisa ficar documentada junto da
> lógica original.
>
> **Aplico essa atualização no project.md?**
