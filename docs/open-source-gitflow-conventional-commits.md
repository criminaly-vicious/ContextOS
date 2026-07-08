# Planejamento Open Source, GitFlow e Conventional Commits

Este documento define o fluxo de colaboração inicial para o Lineora, considerando o estado atual do repositório: um CLI Node.js/TypeScript publicado como `@criminaly-vicious/ctx`, que gera briefs de contexto para agentes a partir de histórico Git local e arquivos `.ai/` mantidos pela equipe.

## Estado das capacidades

### Confirmadas no código atual

- CLI `ctx` com comandos `init` e `brief <claude|cursor|codex>`.
- Geração de briefs segmentados por agente com `--task` opcional para escopo fechado.
- Inicialização de `.ai/ctx.md`, `.ai/tasks.md`, `.ai/config.json` e `.ai/usage.log` por meio de `ctx init`.
- Telemetria anônima opt-in, desativada em execução não interativa e configurável em `.ai/config.json`.
- Operação local/offline para leitura de contexto e histórico Git, sem envio de conteúdo do repositório.
- Scripts de desenvolvimento: `npm run build`, `npm run lint`, `npm test` e `npm pack`.

### Planejadas para Open Source

- Template de issue para bug report, feature request, documentação e release checklist.
- Template de pull request com checklist de testes, documentação e compatibilidade.
- Guia `CONTRIBUTING.md` com fluxo de branches, Conventional Commits e critérios de revisão.
- Código de conduta e política de segurança para reportes privados.
- Documentação de release e versionamento semântico para publicar o pacote npm.
- Backlog público organizado por épicos, issues e cards Kanban.

### Hipóteses a validar

- O nome de produto público será Lineora, enquanto o pacote npm permanecerá `@criminaly-vicious/ctx` durante a fase inicial.
- O projeto priorizará contribuidores que trabalham com agentes de código e precisam de contexto local reproduzível.
- GitFlow completo será útil enquanto houver releases coordenadas; se o volume de manutenção for baixo, o fluxo poderá migrar para trunk-based development simplificado.
- A telemetria permanecerá opt-in e mínima, sem coleta de conteúdo de repositório.

## Modelo de colaboração Open Source

### Princípios

1. **Transparência por padrão:** decisões relevantes devem ser registradas em issues, pull requests ou documentação.
2. **Privacidade por padrão:** conteúdo de repositórios de usuários não deve ser enviado para serviços externos.
3. **Escopo pequeno:** PRs devem ser pequenos, revisáveis e associados a uma issue ou card.
4. **Automação verificável:** mudanças devem informar comandos executados e resultados.
5. **Compatibilidade explícita:** alterações de CLI, arquivos `.ai/` ou saída de briefs devem documentar impacto para usuários.

### Papéis sugeridos

- **Maintainer:** triagem de issues, revisão final, merges, releases e publicação npm.
- **Contributor:** implementação de issues, documentação, testes e feedback de uso.
- **Reviewer:** revisão técnica, validação de UX de CLI, riscos de privacidade e regressões.

### Definição de pronto para issue

Uma issue está pronta para desenvolvimento quando possui:

- Objetivo claro e verificável.
- Categoria de capacidade: `confirmada`, `planejada` ou `hipótese`.
- Critérios de aceitação.
- Arquivos ou áreas prováveis de impacto.
- Comandos de validação esperados quando aplicável.

### Definição de concluído para PR

Um PR está concluído quando:

- Atende aos critérios de aceitação da issue vinculada.
- Inclui ou atualiza documentação quando muda comportamento público.
- Executa `npm run lint` e `npm test`, ou justifica limitações de ambiente.
- Usa título e commits em Conventional Commits.
- Não reverte trabalho não relacionado de outros contribuidores.

## GitFlow proposto

### Branches permanentes

- `main`: estado estável, publicado ou pronto para release.
- `develop`: integração contínua das próximas mudanças, quando houver múltiplos PRs concorrentes.

### Branches temporárias

| Tipo | Origem | Destino | Padrão | Uso |
| --- | --- | --- | --- | --- |
| Feature | `develop` | `develop` | `feature/<issue>-<slug>` | Novas capacidades e melhorias planejadas. |
| Fix | `develop` | `develop` | `fix/<issue>-<slug>` | Correções sem urgência de produção. |
| Docs | `develop` | `develop` | `docs/<issue>-<slug>` | Documentação, exemplos e guias. |
| Release | `develop` | `main` e `develop` | `release/vX.Y.Z` | Estabilização, changelog e versão. |
| Hotfix | `main` | `main` e `develop` | `hotfix/vX.Y.Z` | Correção crítica em versão publicada. |

### Fluxo de trabalho

1. Abrir ou selecionar issue com escopo pronto.
2. Criar branch temporária a partir de `develop`.
3. Implementar mudanças em commits pequenos e convencionais.
4. Abrir PR para `develop` com checklist completo.
5. Revisar, ajustar e validar comandos.
6. Fazer squash merge ou merge commit conforme política ativa do repositório.
7. Promover release via branch `release/vX.Y.Z` quando houver conjunto de mudanças pronto.

### Política de releases

- Usar versionamento semântico: `MAJOR.MINOR.PATCH`.
- `fix:` gera candidato a patch.
- `feat:` gera candidato a minor.
- Mudanças com `BREAKING CHANGE:` geram candidato a major.
- Releases devem incluir changelog, validação local e confirmação de pacote via `npm pack` antes de publicação.

## Conventional Commits

### Formato

```text
<tipo>(escopo opcional): <descrição imperativa curta>

Corpo opcional explicando motivação e impacto.

Rodapé opcional para issues e breaking changes.
```

### Tipos recomendados

| Tipo | Quando usar | Exemplo |
| --- | --- | --- |
| `feat` | Nova capacidade de usuário | `feat(cli): add json brief output` |
| `fix` | Correção de bug | `fix(init): preserve existing ctx task file` |
| `docs` | Documentação | `docs(workflow): add open source planning` |
| `test` | Testes | `test(briefs): cover codex task override` |
| `refactor` | Mudança interna sem comportamento novo | `refactor(git): isolate command parsing` |
| `chore` | Manutenção sem impacto direto | `chore(release): prepare v0.1.1` |
| `build` | Build, pacote ou dependências | `build(ts): update compiler target` |
| `ci` | Pipelines e automação | `ci(node): run test matrix` |

### Escopos sugeridos

- `cli`: parsing, comandos, help e erros.
- `briefs`: renderização de briefs por agente.
- `context`: arquivos `.ai/` e leitura de contexto.
- `git`: histórico, arquivos alterados e detecção de root.
- `usage`: log local e telemetria.
- `docs`: documentação pública e planejamento.
- `release`: versionamento, changelog e publicação.

### Exemplos de rodapé

```text
Closes #42
```

```text
BREAKING CHANGE: renames ctx brief codex --task to --scope.
```

## Governança inicial de labels

| Label | Propósito |
| --- | --- |
| `type: epic` | Agrupador de entregas grandes. |
| `type: bug` | Comportamento incorreto confirmado. |
| `type: feature` | Capacidade nova planejada. |
| `type: docs` | Documentação e exemplos. |
| `type: chore` | Manutenção. |
| `status: needs-triage` | Precisa de análise inicial. |
| `status: ready` | Pode ser implementada. |
| `status: blocked` | Depende de decisão ou trabalho externo. |
| `capability: confirmed` | Já existe no código e precisa manutenção/evolução. |
| `capability: planned` | Planejada, mas ainda não implementada. |
| `capability: hypothesis` | Suposição a validar antes de construir. |
| `good first issue` | Boa para novos contribuidores. |
| `privacy` | Envolve dados locais, telemetria ou segurança. |
