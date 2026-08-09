import { NextResponse } from "next/server";
import { DemoEventProvider } from "@/lib/sentinel/providers/demo-provider";

export async function GET() {
  const result = await new DemoEventProvider().ingest();

  return NextResponse.json({
    ...result,
    total: result.events.length,
    schemaVersion: "2.0",
    dataMode: "SIMULATED",
    operationalUse: false,
  });
}
