import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { readConfig } from "./context.js";

export interface UsageEvent {
  installationId: string;
  command: string;
  timestamp: string;
}

function validEndpoint(endpoint: string | null): endpoint is string {
  if (!endpoint) {
    return false;
  }

  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export async function recordUsage(
  root: string,
  command: string,
  now: Date = new Date(),
): Promise<UsageEvent> {
  const config = readConfig(root);
  const event: UsageEvent = {
    installationId: config.installationId,
    command,
    timestamp: now.toISOString(),
  };

  appendFileSync(
    join(root, ".ai", "usage.log"),
    `${JSON.stringify(event)}\n`,
    "utf8",
  );

  if (config.telemetry.enabled && validEndpoint(config.telemetry.endpoint)) {
    try {
      await fetch(config.telemetry.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(2_000),
      });
    } catch {
      // Telemetry must never prevent an offline command from succeeding.
    }
  }

  return event;
}
