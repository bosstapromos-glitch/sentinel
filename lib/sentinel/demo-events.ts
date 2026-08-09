import type {
  EventCategory,
  SentinelEvent,
  Severity,
  Source,
  VerificationStatus,
} from "./types";

const now = Date.now();
const isoAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString();

type Seed = {
  id: string;
  title: string;
  shortTitle: string;
  category: EventCategory;
  eventType: string;
  lat: number;
  lon: number;
  country: string;
  countryCode: string;
  city: string;
  jurisdiction: string;
  severity: Severity;
  verificationStatus: VerificationStatus;
  confidence: number;
  minutesAgo: number;
  summary: string;
  facts: string[];
  claims: string[];
  assessment: string[];
  unknowns: string[];
  positive: string[];
  limiting: string[];
  sourceKind?: Source["sourceType"];
  sourceName: string;
};

const seeds: Seed[] = [
  {
    id: "demo-ops-2042",
    title: "SIMULATED — Coordinated emergency response at Port Meridian",
    shortTitle: "Port Meridian response",
    category: "CRITICAL_INFRASTRUCTURE",
    eventType: "PORT_DISRUPTION",
    lat: 51.95,
    lon: 4.14,
    country: "Netherlands",
    countryCode: "NL",
    city: "Rotterdam",
    jurisdiction: "Rotterdam-Rijnmond Safety Region",
    severity: "CRITICAL",
    verificationStatus: "VERIFIED",
    confidence: 91,
    minutesAgo: 18,
    summary: "A simulated hazardous-materials alarm has paused operations in one port sector while fire and port authorities assess the affected berth.",
    facts: ["Port operations in Sector 4 are paused.", "The regional operations center is coordinating the response."],
    claims: ["Two workers may have received medical evaluation."],
    assessment: ["Disruption is currently localized; wider logistics effects remain possible if the exclusion zone expands."],
    unknowns: ["Material identity", "Estimated time to resume operations"],
    positive: ["Agency confirmation", "Two independent sensor alerts", "Location and timestamp confirmed"],
    limiting: ["Material identity pending laboratory confirmation"],
    sourceKind: "OFFICIAL_GOVERNMENT",
    sourceName: "Demo Port Authority",
  },
  {
    id: "demo-fire-1187",
    title: "SIMULATED — Fast-moving wildfire near North Valley communities",
    shortTitle: "North Valley wildfire",
    category: "DISASTER",
    eventType: "WILDFIRE",
    lat: 34.31,
    lon: -118.42,
    country: "United States",
    countryCode: "US",
    city: "North Valley",
    jurisdiction: "Demo County Emergency Management",
    severity: "HIGH",
    verificationStatus: "CORROBORATED",
    confidence: 84,
    minutesAgo: 31,
    summary: "A simulated wildfire is moving through dry terrain. Evacuation warnings are active for two planning zones.",
    facts: ["Fire detection confirmed by two public sensor feeds.", "Evacuation warning issued for Zones NV-2 and NV-3."],
    claims: ["A local road may be impassable because of smoke."],
    assessment: ["Wind direction could bring smoke toward the regional hospital within two hours."],
    unknowns: ["Structure damage", "Full perimeter"],
    positive: ["Thermal sensor corroboration", "Emergency management bulletin", "Timestamp confirmed"],
    limiting: ["Perimeter is an estimate", "Ground crew report pending"],
    sourceKind: "SENSOR_FEED",
    sourceName: "Demo Wildfire Sensor Network",
  },
  {
    id: "demo-grid-3310",
    title: "SIMULATED — Regional power instability under investigation",
    shortTitle: "Regional grid instability",
    category: "INFRASTRUCTURE",
    eventType: "POWER_OUTAGE",
    lat: 52.49,
    lon: 13.4,
    country: "Germany",
    countryCode: "DE",
    city: "Berlin",
    jurisdiction: "Berlin Demonstration Grid Region",
    severity: "HIGH",
    verificationStatus: "ANALYZING",
    confidence: 68,
    minutesAgo: 42,
    summary: "Multiple simulated telemetry anomalies indicate intermittent power loss across three distribution areas.",
    facts: ["Automated alarms were received from three substations."],
    claims: ["Public reporting indicates transit delays in the eastern district."],
    assessment: ["Current evidence supports a technical fault more strongly than malicious activity."],
    unknowns: ["Root cause", "Number of customers affected"],
    positive: ["Three independent telemetry alerts", "Geolocation confirmed"],
    limiting: ["Operator confirmation pending", "Customer impact estimate incomplete"],
    sourceKind: "AUTHORIZED_PRIVATE_FEED",
    sourceName: "Demo Grid Operations Feed",
  },
  {
    id: "demo-cyber-7715",
    title: "SIMULATED — Municipal service portal experiencing coordinated disruption",
    shortTitle: "Municipal portal disruption",
    category: "CYBER",
    eventType: "DENIAL_OF_SERVICE",
    lat: 1.29,
    lon: 103.85,
    country: "Singapore",
    countryCode: "SG",
    city: "Singapore",
    jurisdiction: "Demo Municipal Digital Services",
    severity: "MODERATE",
    verificationStatus: "CORROBORATING",
    confidence: 74,
    minutesAgo: 57,
    summary: "A simulated traffic surge is degrading access to a municipal service portal. Essential dispatch systems are not affected.",
    facts: ["Portal latency exceeds the service threshold.", "Emergency dispatch remains operational."],
    claims: ["A public channel claimed responsibility; attribution is unverified."],
    assessment: ["Traffic characteristics are consistent with a denial-of-service attempt, but attribution cannot be established."],
    unknowns: ["Actor", "Duration", "Whether other services are targeted"],
    positive: ["Network telemetry confirmed", "Service owner acknowledgement"],
    limiting: ["Attribution claim is single-source", "Traffic origin is obscured"],
    sourceKind: "SENSOR_FEED",
    sourceName: "Demo Network Operations Center",
  },
  {
    id: "demo-flood-5521",
    title: "SIMULATED — River level exceeds operational threshold",
    shortTitle: "River threshold exceeded",
    category: "WEATHER",
    eventType: "FLOOD_WARNING",
    lat: 35.69,
    lon: 139.69,
    country: "Japan",
    countryCode: "JP",
    city: "Tokyo",
    jurisdiction: "Demo Metropolitan Flood Control",
    severity: "MODERATE",
    verificationStatus: "VERIFIED",
    confidence: 95,
    minutesAgo: 83,
    summary: "A simulated river gauge has exceeded the operational monitoring threshold following sustained rainfall.",
    facts: ["Gauge reading verified.", "Flood-control team moved to enhanced monitoring."],
    claims: [],
    assessment: ["No immediate population impact is indicated; low-lying transport routes warrant monitoring."],
    unknowns: ["Peak level"],
    positive: ["Trusted sensor feed", "Agency confirmation", "Timestamp confirmed"],
    limiting: ["Forecast uncertainty remains"],
    sourceKind: "OFFICIAL_GOVERNMENT",
    sourceName: "Demo Flood Control Bureau",
  },
  {
    id: "demo-aviation-9044",
    title: "SIMULATED — Airport ground stop following runway inspection",
    shortTitle: "Airport ground stop",
    category: "AVIATION",
    eventType: "GROUND_STOP",
    lat: -33.94,
    lon: 151.18,
    country: "Australia",
    countryCode: "AU",
    city: "Sydney",
    jurisdiction: "Demo Airport Operations",
    severity: "LOW",
    verificationStatus: "CORROBORATED",
    confidence: 82,
    minutesAgo: 112,
    summary: "A simulated short-duration ground stop is in effect while airport teams inspect a runway surface report.",
    facts: ["Departures are temporarily held.", "Emergency response is not activated."],
    claims: ["Several inbound flights may divert."],
    assessment: ["The interruption is likely short-lived if inspection finds no surface damage."],
    unknowns: ["Inspection completion time"],
    positive: ["Airport operations bulletin", "Flight data corroboration"],
    limiting: ["Diversion count not confirmed"],
    sourceKind: "PARTNER_AGENCY_FEED",
    sourceName: "Demo Aviation Coordination Feed",
  },
];

function makeEvent(seed: Seed): SentinelEvent {
  const sourceId = `src-${seed.id}`;
  const detectedAt = isoAgo(seed.minutesAgo);
  const updatedAt = isoAgo(Math.max(2, seed.minutesAgo - 12));
  const label = seed.confidence >= 90 ? "VERY_HIGH" : seed.confidence >= 75 ? "HIGH" : seed.confidence >= 50 ? "MODERATE" : "LOW";
  const source: Source = {
    id: sourceId,
    name: seed.sourceName,
    sourceType: seed.sourceKind ?? "PARTNER_AGENCY_FEED",
    organization: seed.jurisdiction,
    timestamp: detectedAt,
    claim: seed.facts[0] ?? seed.summary,
    reliability: seed.confidence >= 90 ? "VERY_HIGH" : seed.confidence >= 75 ? "HIGH" : "MEDIUM",
    verificationHistory: ["Source identity checked", "Timestamp reviewed"],
    classificationLevel: "PUBLIC",
    reference: `DEMO/${seed.id.toUpperCase()}`,
    analystNotes: "Synthetic source generated for SENTINEL V2 product demonstration.",
    confidence: seed.confidence,
    independent: true,
  };

  return {
    schemaVersion: "2.0",
    id: seed.id,
    title: seed.title,
    shortTitle: seed.shortTitle,
    eventType: seed.eventType,
    category: seed.category,
    latitude: seed.lat,
    longitude: seed.lon,
    country: seed.country,
    countryCode: seed.countryCode,
    city: seed.city,
    jurisdiction: seed.jurisdiction,
    timestamp: detectedAt,
    firstDetected: detectedAt,
    lastUpdated: updatedAt,
    status: seed.severity === "LOW" ? "MONITORING" : "DEVELOPING",
    severity: seed.severity,
    priority: seed.severity === "CRITICAL" ? "IMMEDIATE" : seed.severity === "HIGH" ? "HIGH_PRIORITY" : "PRIORITY",
    confidence: {
      score: seed.confidence,
      label,
      methodology: "SENTINEL confidence assessment based on currently available evidence.",
      assessedAt: updatedAt,
      assessedBy: "SENTINEL_ENGINE",
      positiveFactors: seed.positive,
      limitingFactors: seed.limiting,
      sourceCount: 3,
      independentSourceCount: 2,
    },
    verificationStatus: seed.verificationStatus,
    classificationLevel: "PUBLIC",
    summary: seed.summary,
    detailedSummary: `${seed.summary} This scenario is synthetic and intended only to demonstrate operational workflow.`,
    confirmedFacts: seed.facts,
    reportedClaims: seed.claims,
    analystAssessment: seed.assessment,
    aiGeneratedAnalysis: ["Potential secondary effects have been suggested for analyst review; this output is not a verified fact."],
    unknowns: seed.unknowns,
    casualties: {
      killed: { min: 0, max: seed.severity === "CRITICAL" ? 1 : 0 },
      injured: { min: 0, max: seed.severity === "CRITICAL" ? 2 : 0 },
      status: seed.severity === "CRITICAL" ? "REPORTED_CLAIM" : "VERIFIED_FACT",
    },
    affectedPopulation: { description: "Assessment pending" },
    sources: [source],
    evidence: [
      {
        id: `evd-${seed.id}`,
        type: "DOCUMENT",
        title: "Synthetic initial situation report",
        origin: seed.sourceName,
        uploadedAt: updatedAt,
        uploadedBy: "Demo Operations Cell",
        verificationStatus: seed.verificationStatus,
        relatedIncidentId: seed.id,
        notes: "Prototype evidence record; no chain-of-custody claim.",
        accessLevel: "PUBLIC",
      },
    ],
    timeline: [
      {
        id: `tl-${seed.id}-1`,
        timestamp: detectedAt,
        description: "Initial signal detected and ingested",
        informationType: "REPORTED_CLAIM",
        verificationStatus: "DETECTED",
        sourceIds: [sourceId],
      },
      {
        id: `tl-${seed.id}-2`,
        timestamp: isoAgo(Math.max(3, seed.minutesAgo - 6)),
        description: "Second independent indicator received",
        informationType: "VERIFIED_FACT",
        verificationStatus: "CORROBORATING",
        sourceIds: [sourceId],
        confidenceChange: { from: Math.max(20, seed.confidence - 18), to: seed.confidence, reason: "Independent corroboration" },
      },
      {
        id: `tl-${seed.id}-3`,
        timestamp: updatedAt,
        description: "Operations cell assessment updated",
        informationType: "ANALYST_ASSESSMENT",
        verificationStatus: seed.verificationStatus,
        actor: { name: "Demo Duty Analyst", organization: seed.jurisdiction },
      },
    ],
    relatedEvents: seeds.filter((candidate) => candidate.id !== seed.id && candidate.category === seed.category).slice(0, 2).map((candidate) => candidate.id),
    relatedEntities: [seed.jurisdiction, seed.city],
    conflictingReports: seed.severity === "CRITICAL" ? [{
      id: `conflict-${seed.id}`,
      subject: "People receiving medical evaluation",
      claims: [
        { sourceId, value: "Two reported", informationType: "REPORTED_CLAIM" },
        { sourceId: "official-pending", value: "Official count not available", informationType: "UNKNOWN" },
      ],
      assessment: "Zero to two people reported; official confirmation pending.",
      status: "OPEN",
    }] : [],
    cameraLinks: [],
    assignedUsers: ["Demo Duty Analyst"],
    assignedTeams: ["Operations Cell"],
    tasks: [
      { id: `task-${seed.id}-1`, title: seed.unknowns[0] ? `Confirm ${seed.unknowns[0].toLowerCase()}` : "Validate latest update", assignee: "Demo Duty Analyst", team: "Verification", status: "IN_PROGRESS", priority: "HIGH_PRIORITY", dueAt: isoAgo(-45) },
      { id: `task-${seed.id}-2`, title: "Contact responsible jurisdiction", team: "Operations Cell", status: "OPEN", priority: "PRIORITY", dueAt: isoAgo(-90) },
    ],
    operationalActions: [
      { id: `action-${seed.id}`, action: "Responsible agency notified", initiatedBy: "Demo Watch Officer", organization: "SENTINEL Demo Operations", timestamp: updatedAt, notes: "Synthetic workflow action." },
    ],
    agencyUpdates: [{ id: `update-${seed.id}`, agency: seed.jurisdiction, timestamp: updatedAt, update: "Coordination channel established (simulated)." }],
    decisionLog: [
      { id: `decision-${seed.id}`, timestamp: updatedAt, decision: `Maintain ${seed.severity} monitoring posture`, authorizedBy: "Demo Operations Commander", organization: "SENTINEL Demo Operations", reason: "Current severity, confidence, and potential operational impact." },
    ],
    tags: ["DEMO_DATA", "SIMULATED", seed.category],
    productLayer: "OPERATIONS",
    demo: true,
    auditMetadata: { createdAt: detectedAt, createdBy: "demo-provider", updatedAt, updatedBy: "demo-provider", version: 1, sourceSystem: "sentinel-demo-provider" },
    accessControl: { visibility: "PUBLIC", roles: ["VIEWER", "OPERATOR", "ANALYST", "SUPERVISOR", "ADMINISTRATOR"] },
  };
}

export const demoEvents: SentinelEvent[] = seeds.map(makeEvent);
