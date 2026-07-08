export type KnowledgeStatus =
  | "verified"
  | "declared"
  | "inferred"
  | "observed"
  | "conflicting"
  | "obsolete"
  | "unverified";

export type EvidenceSourceType =
  | "source_code"
  | "git_history"
  | "issue"
  | "pull_request"
  | "test"
  | "ci"
  | "scanner"
  | "adr"
  | "human_review"
  | "runtime_signal";

export interface EvidenceSource {
  type: EvidenceSourceType;
  reference: string;
  confidence: number;
  status: KnowledgeStatus;
  collectedAt: string;
}

export interface ChangePassport {
  changeId: string;
  intent: {
    source: string;
    description: string;
  };
  actor: {
    type: "human" | "ai_agent" | "automation";
    name: string;
    initiatedBy?: string;
  };
  scope: {
    repositories: string[];
    components: string[];
    files: string[];
  };
  risk: {
    level: "low" | "medium" | "high" | "critical";
    reasons: string[];
  };
  evidence: EvidenceSource[];
  gaps: string[];
  outcome: {
    deployed: boolean;
    incident: string | null;
    summary?: string;
  };
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface PassportValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function pushRequiredString(
  issues: ValidationIssue[],
  record: Record<string, unknown>,
  key: string,
  path: string,
): void {
  if (!isNonEmptyString(record[key])) {
    issues.push({ path, message: "Expected a non-empty string." });
  }
}

function pushStringArray(
  issues: ValidationIssue[],
  record: Record<string, unknown>,
  key: string,
  path: string,
): void {
  if (!isStringArray(record[key])) {
    issues.push({ path, message: "Expected an array of non-empty strings." });
  }
}

export function validateChangePassport(input: unknown): PassportValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isRecord(input)) {
    return {
      valid: false,
      issues: [{ path: "$", message: "Expected a Change Passport object." }],
    };
  }

  pushRequiredString(issues, input, "changeId", "changeId");

  const intent = input.intent;
  if (isRecord(intent)) {
    pushRequiredString(issues, intent, "source", "intent.source");
    pushRequiredString(issues, intent, "description", "intent.description");
  } else {
    issues.push({ path: "intent", message: "Expected intent details." });
  }

  const actor = input.actor;
  if (isRecord(actor)) {
    if (!["human", "ai_agent", "automation"].includes(String(actor.type))) {
      issues.push({ path: "actor.type", message: "Expected human, ai_agent, or automation." });
    }
    pushRequiredString(issues, actor, "name", "actor.name");
  } else {
    issues.push({ path: "actor", message: "Expected actor details." });
  }

  const scope = input.scope;
  if (isRecord(scope)) {
    pushStringArray(issues, scope, "repositories", "scope.repositories");
    pushStringArray(issues, scope, "components", "scope.components");
    pushStringArray(issues, scope, "files", "scope.files");
  } else {
    issues.push({ path: "scope", message: "Expected scope details." });
  }

  const risk = input.risk;
  if (isRecord(risk)) {
    if (!["low", "medium", "high", "critical"].includes(String(risk.level))) {
      issues.push({ path: "risk.level", message: "Expected low, medium, high, or critical." });
    }
    pushStringArray(issues, risk, "reasons", "risk.reasons");
  } else {
    issues.push({ path: "risk", message: "Expected risk details." });
  }

  if (!Array.isArray(input.evidence) || input.evidence.length === 0) {
    issues.push({ path: "evidence", message: "At least one evidence source is required." });
  } else {
    input.evidence.forEach((item, index) => {
      if (!isRecord(item)) {
        issues.push({ path: `evidence[${index}]`, message: "Expected evidence object." });
        return;
      }
      pushRequiredString(issues, item, "type", `evidence[${index}].type`);
      pushRequiredString(issues, item, "reference", `evidence[${index}].reference`);
      if (typeof item.confidence !== "number" || item.confidence < 0 || item.confidence > 1) {
        issues.push({ path: `evidence[${index}].confidence`, message: "Expected confidence between 0 and 1." });
      }
      pushRequiredString(issues, item, "status", `evidence[${index}].status`);
      pushRequiredString(issues, item, "collectedAt", `evidence[${index}].collectedAt`);
    });
  }

  if (!Array.isArray(input.gaps)) {
    issues.push({ path: "gaps", message: "Expected an array of gap descriptions." });
  }

  const outcome = input.outcome;
  if (isRecord(outcome)) {
    if (typeof outcome.deployed !== "boolean") {
      issues.push({ path: "outcome.deployed", message: "Expected a boolean deployment state." });
    }
    if (!(typeof outcome.incident === "string" || outcome.incident === null)) {
      issues.push({ path: "outcome.incident", message: "Expected incident id or null." });
    }
  } else {
    issues.push({ path: "outcome", message: "Expected outcome details." });
  }

  return { valid: issues.length === 0, issues };
}

export function renderImpactBrief(passport: ChangePassport): string {
  const evidenceLines = passport.evidence
    .map(
      (source) =>
        `- ${source.type}: ${source.reference} (${source.status}, confidence ${source.confidence})`,
    )
    .join("\n");
  const gaps = passport.gaps.length > 0 ? passport.gaps.map((gap) => `- ${gap}`).join("\n") : "- No gaps recorded.";

  return `# Lineora Impact Brief\n\nChange: ${passport.changeId}\nIntent: ${passport.intent.description}\nRisk: ${passport.risk.level}\n\n## Scope\n- Repositories: ${passport.scope.repositories.join(", ")}\n- Components: ${passport.scope.components.join(", ")}\n- Files: ${passport.scope.files.join(", ")}\n\n## Evidence\n${evidenceLines}\n\n## Gaps\n${gaps}\n`;
}
