// Centralized Mock Data with generic Lorem Ipsum content for all template routes

export interface MockKpi {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  subtext: string;
}

export const MOCK_KPIS: MockKpi[] = [
  {
    title: "Metric Alpha",
    value: "42,891",
    change: "+12.4%",
    isPositive: true,
    subtext: "vs. prior 30-day window",
  },
  {
    title: "Metric Beta",
    value: "99.94%",
    change: "+0.18%",
    isPositive: true,
    subtext: "System throughput index",
  },
  {
    title: "Metric Gamma",
    value: "1,248",
    change: "-4.2%",
    isPositive: false,
    subtext: "Active processing instances",
  },
  {
    title: "Metric Delta",
    value: "$384.2K",
    change: "+8.9%",
    isPositive: true,
    subtext: "Operational capital efficiency",
  },
];

export const MOCK_TREND_DATA = [
  { time: "00:00", valueA: 400, valueB: 240, valueC: 180 },
  { time: "04:00", valueA: 520, valueB: 310, valueC: 220 },
  { time: "08:00", valueA: 780, valueB: 480, valueC: 340 },
  { time: "12:00", valueA: 920, valueB: 640, valueC: 410 },
  { time: "16:00", valueA: 840, valueB: 590, valueC: 380 },
  { time: "20:00", valueA: 670, valueB: 430, valueC: 290 },
  { time: "23:59", valueA: 590, valueB: 380, valueC: 240 },
];

export const MOCK_CATEGORY_DISTRIBUTION = [
  { name: "Tier Alpha", value: 38, count: 1420 },
  { name: "Cluster Beta", value: 27, count: 980 },
  { name: "Cluster Gamma", value: 21, count: 760 },
  { name: "Cluster Delta", value: 14, count: 510 },
];

export interface MockAlert {
  id: string;
  title: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
}

export const MOCK_ALERTS: MockAlert[] = [
  {
    id: "ALT-1001",
    title: "Lorem ipsum dolor sit amet conflux",
    description: "Consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    severity: "CRITICAL",
    category: "Infrastructure",
    source: "Cluster-Alpha",
    timestamp: "12 mins ago",
    acknowledged: false,
  },
  {
    id: "ALT-1002",
    title: "Duis aute irure dolor in reprehenderit",
    description: "Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est.",
    severity: "HIGH",
    category: "Data Stream",
    source: "Router-East-04",
    timestamp: "34 mins ago",
    acknowledged: false,
  },
  {
    id: "ALT-1003",
    title: "Ullamco laboris nisi ut aliquip ex ea",
    description: "Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure.",
    severity: "MEDIUM",
    category: "Network",
    source: "Edge-Gateway-09",
    timestamp: "1 hour ago",
    acknowledged: true,
  },
  {
    id: "ALT-1004",
    title: "Voluptate velit esse cillum dolore eu",
    description: "Fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa.",
    severity: "LOW",
    category: "Storage",
    source: "Vault-Instance-02",
    timestamp: "3 hours ago",
    acknowledged: true,
  },
  {
    id: "ALT-1005",
    title: "Tempor incididunt ut labore et dolore",
    description: "Adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim.",
    severity: "CRITICAL",
    category: "Security",
    source: "Auth-Service",
    timestamp: "4 hours ago",
    acknowledged: false,
  },
];

export interface MockCase {
  id: string;
  code: string;
  title: string;
  summary: string;
  status: "OPEN" | "INVESTIGATING" | "MITIGATING" | "RESOLVED";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  assignee: {
    name: string;
    avatar: string;
    role: string;
  };
  impactScore: number;
  createdAt: string;
  updatedAt: string;
}

export const MOCK_CASES: MockCase[] = [
  {
    id: "case-101",
    code: "CASE-2026-001",
    title: "Lorem ipsum event variance in sector 4",
    summary: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum.",
    status: "INVESTIGATING",
    priority: "CRITICAL",
    assignee: {
      name: "Alex Morgan",
      avatar: "AM",
      role: "Lead Architect",
    },
    impactScore: 94,
    createdAt: "2026-10-31T08:24:00Z",
    updatedAt: "10 mins ago",
  },
  {
    id: "case-102",
    code: "CASE-2026-002",
    title: "Consectetur adipiscing elit node oscillation",
    summary: "Nam libero tempore cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime.",
    status: "MITIGATING",
    priority: "HIGH",
    assignee: {
      name: "Marcus Thorne",
      avatar: "MT",
      role: "Systems Specialist",
    },
    impactScore: 78,
    createdAt: "2026-10-30T14:15:00Z",
    updatedAt: "1 hour ago",
  },
  {
    id: "case-103",
    code: "CASE-2026-003",
    title: "Sed ut perspiciatis unde omnis iste natus",
    summary: "Totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta.",
    status: "OPEN",
    priority: "MEDIUM",
    assignee: {
      name: "Sarah Chen",
      avatar: "SC",
      role: "Operations Engineer",
    },
    impactScore: 52,
    createdAt: "2026-10-29T19:40:00Z",
    updatedAt: "4 hours ago",
  },
  {
    id: "case-104",
    code: "CASE-2026-004",
    title: "Nemo enim ipsam voluptatem quia voluptas sit",
    summary: "Aspernatur aut odit aut fugit sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
    status: "RESOLVED",
    priority: "LOW",
    assignee: {
      name: "David Kim",
      avatar: "DK",
      role: "Compliance Auditor",
    },
    impactScore: 23,
    createdAt: "2026-10-28T11:05:00Z",
    updatedAt: "1 day ago",
  },
];

export interface MockProfile {
  id: string;
  referenceId: string;
  name: string;
  category: "Service Alpha" | "Worker Beta" | "Gateway Gamma" | "Storage Delta";
  status: "ACTIVE" | "STANDBY" | "MAINTENANCE" | "WARNING";
  healthScore: number;
  assignedOperator: string;
  lastPing: string;
  parameters: {
    latency: string;
    throughput: string;
    cpuLoad: string;
    memoryUsage: string;
  };
}

export const MOCK_PROFILES: MockProfile[] = [
  {
    id: "prof-001",
    referenceId: "ENT-1001",
    name: "Lorem-Instance-Alpha",
    category: "Service Alpha",
    status: "ACTIVE",
    healthScore: 98,
    assignedOperator: "Alex Morgan",
    lastPing: "Just now",
    parameters: {
      latency: "14.2 ms",
      throughput: "4,820 req/s",
      cpuLoad: "28.5%",
      memoryUsage: "42.1%",
    },
  },
  {
    id: "prof-002",
    referenceId: "ENT-1002",
    name: "Ipsum-Worker-Beta",
    category: "Worker Beta",
    status: "WARNING",
    healthScore: 64,
    assignedOperator: "Marcus Thorne",
    lastPing: "2 mins ago",
    parameters: {
      latency: "98.5 ms",
      throughput: "1,140 req/s",
      cpuLoad: "86.2%",
      memoryUsage: "78.4%",
    },
  },
  {
    id: "prof-003",
    referenceId: "ENT-1003",
    name: "Dolor-Gateway-Gamma",
    category: "Gateway Gamma",
    status: "ACTIVE",
    healthScore: 95,
    assignedOperator: "Sarah Chen",
    lastPing: "1 min ago",
    parameters: {
      latency: "8.1 ms",
      throughput: "12,450 req/s",
      cpuLoad: "34.0%",
      memoryUsage: "39.5%",
    },
  },
  {
    id: "prof-004",
    referenceId: "ENT-1004",
    name: "Consectetur-Storage-Delta",
    category: "Storage Delta",
    status: "ACTIVE",
    healthScore: 100,
    assignedOperator: "David Kim",
    lastPing: "Just now",
    parameters: {
      latency: "2.4 ms",
      throughput: "8,900 req/s",
      cpuLoad: "18.2%",
      memoryUsage: "52.0%",
    },
  },
];

export interface MockAuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  status: "SUCCESS" | "FLAGGED" | "BLOCKED";
  ipAddress: string;
}

export const MOCK_AUDIT_LOGS: MockAuditEntry[] = [
  {
    id: "AUD-101",
    actor: "alex.morgan@example.com",
    action: "UPDATE_CONFIGURATION",
    target: "Cluster-Alpha / Node-01",
    timestamp: "2026-11-01 17:15:22 UTC",
    status: "SUCCESS",
    ipAddress: "192.168.1.42",
  },
  {
    id: "AUD-102",
    actor: "automated_process",
    action: "TRIGGER_HEALTH_EVALUATION",
    target: "Service-Beta / Worker-Pool",
    timestamp: "2026-11-01 16:58:10 UTC",
    status: "SUCCESS",
    ipAddress: "10.0.8.12",
  },
  {
    id: "AUD-103",
    actor: "marcus.thorne@example.com",
    action: "OVERRIDE_SECURITY_THRESHOLD",
    target: "Gateway-Gamma / Router",
    timestamp: "2026-11-01 15:30:44 UTC",
    status: "FLAGGED",
    ipAddress: "192.168.1.88",
  },
  {
    id: "AUD-104",
    actor: "external_service",
    action: "UNAUTHORIZED_INVOKE_ATTEMPT",
    target: "API-Endpoint / v1 / flush",
    timestamp: "2026-11-01 14:12:05 UTC",
    status: "BLOCKED",
    ipAddress: "203.0.113.195",
  },
];

export const MOCK_FINANCIAL_BREAKDOWN = [
  { category: "Compute Infrastructure", allocated: 120000, consumed: 98400, variance: "-18.0%" },
  { category: "Network Bandwidth", allocated: 85000, consumed: 82100, variance: "-3.4%" },
  { category: "Database & Storage", allocated: 160000, consumed: 174200, variance: "+8.8%" },
  { category: "Security & Monitoring", allocated: 50000, consumed: 41200, variance: "-17.6%" },
];

export const MOCK_INGESTION_JOBS = [
  {
    id: "job-101",
    fileName: "sample_batch_records_v1.json",
    fileSize: "48.2 MB",
    recordsCount: 184500,
    status: "COMPLETED",
    uploadedBy: "Alex Morgan",
    timestamp: "2026-11-01 12:40",
  },
  {
    id: "job-102",
    fileName: "dataset_import_catalog.csv",
    fileSize: "128.5 MB",
    recordsCount: 654200,
    status: "PROCESSING",
    uploadedBy: "Automated System",
    timestamp: "2026-11-01 16:15",
  },
  {
    id: "job-103",
    fileName: "event_stream_logs.json",
    fileSize: "14.1 MB",
    recordsCount: 42100,
    status: "COMPLETED",
    uploadedBy: "Sarah Chen",
    timestamp: "2026-10-31 22:04",
  },
];

export const MOCK_NETWORK_NODES = [
  { id: "node-1", label: "Node Alpha", type: "Core", x: 250, y: 150, status: "healthy" },
  { id: "node-2", label: "Node Beta", type: "Edge", x: 120, y: 280, status: "healthy" },
  { id: "node-3", label: "Node Gamma", type: "Compute", x: 380, y: 280, status: "warning" },
  { id: "node-4", label: "Node Delta", type: "Service", x: 250, y: 380, status: "healthy" },
  { id: "node-5", label: "Node Epsilon", type: "Storage", x: 80, y: 120, status: "healthy" },
  { id: "node-6", label: "Node Zeta", type: "Gateway", x: 420, y: 120, status: "critical" },
];

export const MOCK_NETWORK_LINKS = [
  { source: "node-1", target: "node-2", strength: 95 },
  { source: "node-1", target: "node-3", strength: 80 },
  { source: "node-1", target: "node-5", strength: 98 },
  { source: "node-1", target: "node-6", strength: 45 },
  { source: "node-2", target: "node-4", strength: 88 },
  { source: "node-3", target: "node-4", strength: 72 },
];
