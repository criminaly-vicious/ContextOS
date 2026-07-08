# Backlog e Kanban Inicial

Este backlog organiza épicos e cards iniciais para o Lineora. As classificações abaixo separam capacidades confirmadas no repositório, capacidades planejadas para colaboração open source e hipóteses que exigem validação antes de implementação.

## Legenda

- **Confirmada:** capacidade já observável no código ou nos scripts atuais.
- **Planejada:** entrega desejada para maturidade open source, ainda não implementada no repositório.
- **Hipótese:** suposição de produto, processo ou adoção que deve ser validada antes de virar compromisso.

## Épicos

### EPIC-001 — Fundação Open Source

**Tipo:** planejada  
**Objetivo:** preparar o repositório para receber contribuições externas com baixo atrito e governança mínima clara.

**Critérios de sucesso:**

- Contribuidores entendem como abrir issues, branches, commits e PRs.
- Maintainers conseguem triagem usando labels e templates padronizados.
- Mudanças públicas têm checklist de validação e documentação.

### EPIC-002 — Confiabilidade do CLI `ctx`

**Tipo:** confirmada  
**Objetivo:** manter os comandos existentes (`init`, `brief`) previsíveis, testados e seguros para uso local.

**Critérios de sucesso:**

- Fluxos principais possuem cobertura de teste.
- Erros de CLI são claros e acionáveis.
- Mudanças preservam arquivos existentes sempre que prometido.

### EPIC-003 — Privacidade, Telemetria e Confiança

**Tipo:** confirmada/planejada  
**Objetivo:** preservar a promessa de operação local e telemetria mínima, tornando-a auditável para usuários e contribuidores.

**Critérios de sucesso:**

- Documentação explica exatamente o que é gravado localmente e o que pode ser enviado.
- Telemetria continua opt-in e desativada em contextos não interativos.
- Alterações em privacidade exigem revisão explícita.

### EPIC-004 — Experiência de Contexto para Agentes

**Tipo:** confirmada/hipótese  
**Objetivo:** evoluir a qualidade dos briefs para Claude, Cursor e Codex sem inventar contexto ausente.

**Critérios de sucesso:**

- Briefs continuam específicos por agente.
- O parâmetro `--task` mantém escopo fechado para trabalho pontual.
- Novos formatos ou agentes são validados com exemplos reais antes de implementação.

### EPIC-005 — Release e Distribuição npm

**Tipo:** planejada  
**Objetivo:** tornar releases reproduzíveis e compatíveis com versionamento semântico.

**Critérios de sucesso:**

- Maintainers têm checklist de release.
- `npm pack` é validado antes de publicação.
- Changelog comunica features, fixes e breaking changes.

## Kanban inicial

### Backlog

#### CARD-001 — Criar `CONTRIBUTING.md`

- **Épico:** EPIC-001
- **Tipo:** planejada
- **Labels:** `type: docs`, `status: ready`, `capability: planned`, `good first issue`
- **Descrição:** documentar GitFlow, Conventional Commits, fluxo de PR, critérios de revisão e comandos de validação.
- **Critérios de aceitação:**
  - Inclui nomes de branches e exemplos de commits.
  - Explica como vincular PRs a issues.
  - Informa `npm run lint` e `npm test` como validações padrão.

#### CARD-002 — Adicionar templates de issue

- **Épico:** EPIC-001
- **Tipo:** planejada
- **Labels:** `type: chore`, `status: ready`, `capability: planned`
- **Descrição:** criar templates para bug, feature, docs e pergunta de uso.
- **Critérios de aceitação:**
  - Cada template pede comportamento esperado, comportamento atual e contexto.
  - Templates distinguem capacidade confirmada, planejada ou hipótese.
  - Bug report inclui versão do Node.js e comando executado.

#### CARD-003 — Adicionar template de pull request

- **Épico:** EPIC-001
- **Tipo:** planejada
- **Labels:** `type: chore`, `status: ready`, `capability: planned`
- **Descrição:** criar checklist de PR para testes, docs, privacidade e breaking changes.
- **Critérios de aceitação:**
  - Checklist inclui validação de `npm run lint` e `npm test`.
  - Checklist pergunta se há impacto em CLI, arquivos `.ai/` ou telemetria.
  - Checklist pede issue relacionada.

#### CARD-004 — Documentar política de privacidade técnica

- **Épico:** EPIC-003
- **Tipo:** planejada
- **Labels:** `type: docs`, `privacy`, `status: ready`, `capability: planned`
- **Descrição:** explicar operação offline, `usage.log`, telemetria opt-in e campos enviados quando ativada.
- **Critérios de aceitação:**
  - Diferencia logs locais de telemetria remota.
  - Afirma que conteúdo do repositório não deve ser enviado.
  - Indica como desativar telemetria.

#### CARD-005 — Cobrir erros de argumentos do CLI

- **Épico:** EPIC-002
- **Tipo:** confirmada
- **Labels:** `type: bug`, `status: needs-triage`, `capability: confirmed`
- **Descrição:** revisar testes para argumentos inválidos em `ctx init`, `ctx brief` e flags incompatíveis.
- **Critérios de aceitação:**
  - Testes cobrem target ausente, target inválido e argumentos extras.
  - Mensagens de erro permanecem úteis para usuário final.
  - Não altera API pública sem justificativa.

#### CARD-006 — Validar hipótese de nome público Lineora

- **Épico:** EPIC-001
- **Tipo:** hipótese
- **Labels:** `status: blocked`, `capability: hypothesis`
- **Descrição:** decidir se documentação pública deve usar Lineora, `ctx`, ou ambos com relação clara entre produto e pacote.
- **Critérios de aceitação:**
  - Decisão registrada em issue ou documento de arquitetura.
  - README e docs usam nomenclatura consistente.
  - Escopo de renomeação é estimado antes de qualquer alteração em pacote.

### Ready

#### CARD-007 — Criar checklist de release

- **Épico:** EPIC-005
- **Tipo:** planejada
- **Labels:** `type: docs`, `status: ready`, `capability: planned`
- **Descrição:** documentar passos para preparar versão, executar validações, gerar pacote e publicar.
- **Critérios de aceitação:**
  - Inclui `npm run clean`, `npm run build`, `npm test` e `npm pack`.
  - Define quando atualizar versão e changelog.
  - Inclui verificação de arquivos publicados pelo pacote.

#### CARD-008 — Mapear fixtures de briefs por agente

- **Épico:** EPIC-004
- **Tipo:** confirmada
- **Labels:** `type: test`, `status: ready`, `capability: confirmed`
- **Descrição:** consolidar exemplos esperados de saída para Claude, Cursor e Codex.
- **Critérios de aceitação:**
  - Fixtures cobrem task padrão e override via `--task`.
  - Testes deixam claro quais seções são específicas por agente.
  - Mudanças futuras em formato exigem atualização intencional.

### In Progress

#### CARD-009 — Documentar planejamento Open Source e backlog

- **Épico:** EPIC-001
- **Tipo:** planejada
- **Labels:** `type: docs`, `status: in-progress`, `capability: planned`
- **Descrição:** criar documentação Markdown inicial para Open Source, GitFlow, Conventional Commits e Kanban.
- **Critérios de aceitação:**
  - Documentação fica em `docs/`.
  - Inclui épicos e cards iniciais.
  - Distingue capacidades confirmadas, planejadas e hipóteses.

### Review

_Nenhum card em revisão no momento._

### Done

#### CARD-010 — Implementar CLI base de briefs

- **Épico:** EPIC-002
- **Tipo:** confirmada
- **Labels:** `type: feature`, `capability: confirmed`
- **Descrição:** CLI já possui comandos para inicialização de contexto e geração de briefs por agente.
- **Evidência:** comandos `ctx init` e `ctx brief <claude|cursor|codex>` documentados e implementados.

#### CARD-011 — Registrar telemetria mínima opt-in

- **Épico:** EPIC-003
- **Tipo:** confirmada
- **Labels:** `type: feature`, `privacy`, `capability: confirmed`
- **Descrição:** fluxo atual registra uso local e permite telemetria anônima configurável.
- **Evidência:** README informa campos mínimos e ausência de envio de conteúdo de repositório.

## Métricas iniciais de acompanhamento

- Tempo médio de triagem de issue.
- Percentual de PRs com testes executados.
- Quantidade de cards bloqueados por hipótese não validada.
- Número de bugs regressivos em comandos existentes.
- Frequência de releases publicadas com checklist completo.

## Próximos refinamentos sugeridos

1. Confirmar nomenclatura pública Lineora versus `ctx`.
2. Abrir issues reais a partir dos cards `READY`.
3. Adicionar templates `.github/` quando a equipe decidir aceitar contribuições externas.
4. Revisar se GitFlow completo é adequado após os primeiros ciclos de contribuição.
