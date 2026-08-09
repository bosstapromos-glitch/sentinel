import { demoEvents } from "../demo-events";
import type { ProviderResult, SentinelProvider } from "../types";

export class DemoEventProvider implements SentinelProvider {
  readonly id = "sentinel-demo-provider";
  readonly layer = "OPERATIONS" as const;

  async ingest(): Promise<ProviderResult> {
    return {
      provider: this.id,
      fetchedAt: new Date().toISOString(),
      events: demoEvents,
      warnings: [
        "All records are simulated demo data.",
        "Do not use this feed for operational decision-making.",
      ],
    };
  }
}
