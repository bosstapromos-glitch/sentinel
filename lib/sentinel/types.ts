export type ProductLayer = "PUBLIC" | "OPERATIONS" | "INTELLIGENCE";
export type ClassificationLevel =
  | "PUBLIC"
  | "INTERNAL"
  | "RESTRICTED"
  | "SENSITIVE"
  | "CUSTOM";
export type Visibility = "PUBLIC" | "AGENCY_ONLY" | "TEAM_ONLY" | "RESTRICTED" | "CUSTOM";

export type EventCategory =
  | "CONFLICT"
  | "MILITARY"
  | "TERRORISM"
  | "MASS_VIOLENCE"
  | "PUBLIC_SAFETY"
  | "PROTEST"
  | "CIVIL_UNREST"
  | "DISASTER"
  | "WEATHER"
  | "CYBER"
  | "INTERNET_OUTAGE"
  | "INFRASTRUCTURE"
  | "AVIATION"
  | "MARITIME"
  | "TRANSPORTATION"
  | "PUBLIC_HEALTH"
  | "POLITICAL"
  | "CRITICAL_INFRASTRUCTURE"
  | (string & {});

export type Severity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type Priority = "ROUTINE" | "PRIORITY" | "HIGH_PRIORITY" | "IMMEDIATE";
export type EventStatus = "DEVELOPING" | "ACTIVE" | "MONITORING" | "CONTAINED" | "RESOLVED" | "ARCHIVED";
export type VerificationStatus =
  | "DETECTED"
  | "ANALYZING"
  | "CORROBORATING"
  | "CORROBORATED"
  | "VERIFIED"
  | "DISPUTED";
export type InformationType =
  | "VERIFIED_FACT"
  | "REPORTED_CLAIM"
  | "ANALYST_ASSESSMENT"
  | "AI_GENERATED_ANALYSIS"
  | "UNKNOWN"
  | "DISPUTED";

export interface AccessControl {
  visibility: Visibility;
  organizations?: string[];
  teams?: string[];
  roles?: Array<"VIEWER" | "OPERATOR" | "ANALYST" | "SUPERVISOR" | "ADMINISTRATOR" | "AGENCY_ADMINISTRATOR">;
}

export interface AuditMetadata {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
  sourceSystem?: string;
}

export interface Source {
  id: string;
  name: string;
  sourceType:
    | "OFFICIAL_GOVERNMENT"
    | "NEWS_ORGANIZATION"
    | "SENSOR_FEED"
    | "PUBLIC_CAMERA"
    | "AUTHORIZED_PRIVATE_FEED"
    | "SATELLITE_DERIVED"
    | "PUBLIC_SOCIAL_REPORTING"
    | "ANONYMOUS_SUBMISSION"
    | "ANALYST_ENTRY"
    | "PARTNER_AGENCY_FEED";
  organization?: string;
  timestamp: string;
  claim: string;
  reliability: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  verificationHistory?: string[];
  classificationLevel: ClassificationLevel;
  reference?: string;
  analystNotes?: string;
  confidence: number;
  independent: boolean;
}

export interface Evidence {
  id: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT" | "SENSOR_READING" | "LINK" | "SCREENSHOT" | "ANALYST_ATTACHMENT";
  title: string;
  origin: string;
  capturedAt?: string;
  uploadedAt: string;
  uploadedBy: string;
  verificationStatus: VerificationStatus;
  relatedIncidentId: string;
  notes?: string;
  integrity?: { algorithm: string; hash: string };
  accessLevel: ClassificationLevel;
}

export interface TimelineEntry {
  id: string;
  timestamp: string;
  description: string;
  informationType: InformationType;
  verificationStatus: VerificationStatus;
  sourceIds?: string[];
  evidenceIds?: string[];
  actor?: { name: string; organization: string };
  confidenceChange?: { from: number; to: number; reason: string };
  operationalActionId?: string;
  decisionId?: string;
}

export interface IncidentTask {
  id: string;
  title: string;
  assignee?: string;
  team?: string;
  status: "OPEN" | "IN_PROGRESS" | "BLOCKED" | "COMPLETE";
  priority: Priority;
  dueAt?: string;
  notes?: string;
  attachmentIds?: string[];
}

export interface OperationalAction {
  id: string;
  action: string;
  initiatedBy: string;
  organization: string;
  timestamp: string;
  notes?: string;
}

export interface DecisionLogEntry {
  id: string;
  timestamp: string;
  decision: string;
  authorizedBy: string;
  organization: string;
  reason: string;
}

export interface ConfidenceAssessment {
  score: number;
  label: "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
  methodology: string;
  assessedAt: string;
  assessedBy: "SENTINEL_ENGINE" | "ANALYST";
  positiveFactors: string[];
  limitingFactors: string[];
  sourceCount: number;
  independentSourceCount: number;
}

export interface ConflictingReport {
  id: string;
  subject: string;
  claims: Array<{ sourceId: string; value: string; informationType: InformationType }>;
  assessment: string;
  status: "OPEN" | "RESOLVED";
}

export interface SentinelEvent {
  schemaVersion: "2.0";
  id: string;
  title: string;
  shortTitle: string;
  eventType: string;
  category: EventCategory;
  subcategory?: string;
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  jurisdiction: string;
  timestamp: string;
  firstDetected: string;
  lastUpdated: string;
  status: EventStatus;
  severity: Severity;
  priority: Priority;
  confidence: ConfidenceAssessment;
  verificationStatus: VerificationStatus;
  classificationLevel: ClassificationLevel;
  summary: string;
  detailedSummary?: string;
  confirmedFacts: string[];
  reportedClaims: string[];
  analystAssessment: string[];
  aiGeneratedAnalysis?: string[];
  unknowns: string[];
  casualties?: { killed?: { min: number; max: number }; injured?: { min: number; max: number }; status: InformationType };
  affectedPopulation?: { estimate?: number; description: string };
  sources: Source[];
  evidence: Evidence[];
  timeline: TimelineEntry[];
  relatedEvents: string[];
  relatedEntities: string[];
  conflictingReports: ConflictingReport[];
  media?: string[];
  attachments?: string[];
  cameraLinks?: string[];
  assignedUsers: string[];
  assignedTeams: string[];
  tasks: IncidentTask[];
  operationalActions: OperationalAction[];
  agencyUpdates: Array<{ id: string; agency: string; timestamp: string; update: string }>;
  decisionLog: DecisionLogEntry[];
  tags: string[];
  productLayer: ProductLayer;
  demo: boolean;
  auditMetadata: AuditMetadata;
  accessControl: AccessControl;
}

export interface ProviderResult {
  provider: string;
  fetchedAt: string;
  events: SentinelEvent[];
  warnings: string[];
}

export interface SentinelProvider<TInput = unknown> {
  id: string;
  layer: ProductLayer;
  ingest(input?: TInput): Promise<ProviderResult>;
}

export interface Watchlist {
  id: string;
  name: string;
  workspaceId: string;
  criteria: {
    locations?: Array<{ latitude: number; longitude: number; radiusKm: number }>;
    countries?: string[];
    facilities?: string[];
    entities?: string[];
    keywords?: string[];
    categories?: EventCategory[];
    minimumSeverity?: Severity;
    minimumConfidence?: number;
  };
  enabled: boolean;
  accessControl: AccessControl;
}

export interface SavedView {
  id: string;
  name: string;
  workspaceId: string;
  camera: { latitude: number; longitude: number; altitude: number };
  layers: string[];
  filters: Record<string, string | number | boolean | string[]>;
}
