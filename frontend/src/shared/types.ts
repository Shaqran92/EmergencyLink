export type Role =
  | 'coordinator'
  | 'ambulance_staff'
  | 'hospital_staff'
  | 'hospital_admin'
  | 'system_admin'
  | 'observer';

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: Role;
  hospitalId?: string | { _id?: string; name?: string } | null;
  ambulanceId?: string | { _id?: string; ambulanceId?: string } | null;
  accountStatus?: 'active' | 'disabled';
}

export interface EmergencyLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface RequiredResource {
  resourceType: string;
  minCount: number;
}

export interface Emergency {
  _id: string;
  caseId: string;
  summary?: string;
  priorityCategory: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  pickupLocation?: EmergencyLocation;
  requiredResources?: RequiredResource[];
  requiredSpecialties?: string[];
  confirmedHospitalId?: string | { _id?: string; name?: string; address?: string } | null;
  createdBy?: string | User;
  version?: number;
  referrals?: Referral[];
  assignments?: AssignmentRecord[];
}

export interface Hospital {
  _id: string;
  name: string;
  status: string;
  city?: string;
  province?: string;
  facilityType?: 'government' | 'private' | 'military' | 'semi_government';
  bedCapacity?: number;
  emergencyHelpline?: string;
  specialties?: string[];
  equipment?: string[];
  location?: { address?: string; lat?: number; lng?: number };
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  freshnessSummary?: Record<string, number>;
}

export interface Referral {
  _id: string;
  caseId: string;
  requestStatus: string;
  hospitalId?: string | {
    _id?: string;
    name?: string;
    location?: { address?: string; lat?: number; lng?: number };
    contactPhone?: string;
    contactEmail?: string;
    address?: string;
  };
  requestedAt?: string;
  responseAt?: string;
  notes?: string;
  expiresAt?: string;
  createdAt?: string;
}

export interface AssignmentRecord {
  _id: string;
  caseId: string;
  ambulanceId?: string | {
    _id?: string;
    ambulanceId?: string;
    status?: string;
    baseHospitalId?: string | { name?: string };
  };
  destinationHospitalId?: string | { _id?: string; name?: string };
  status: string;
  assignedAt?: string;
  enRouteAt?: string;
  arrivedAt?: string;
  handedOverAt?: string;
  createdAt?: string;
}

export interface Ambulance {
  _id: string;
  ambulanceId: string;
  status: string;
  baseHospitalId?: string | { name?: string };
  currentLocation?: { lat?: number; lng?: number };
}

export interface DashboardSummary {
  activeCases?: number;
  pendingReferrals?: number;
  ambulanceStatuses?: Record<string, number>;
  freshnessBreakdown?: Record<string, number>;
  recentEmergencies?: Emergency[];
}

export interface Candidate {
  hospitalId: string;
  hospitalName?: string;
  score: number;
  etaMinutes?: number;
  freshnessStatus?: string;
  explanation?: string[];
  warnings?: string[];
}

export interface RecommendationResult {
  eligible?: Candidate[];
  ineligible?: Array<{ hospitalName?: string; reasons?: string[] }>;
  disclaimer?: string;
}

export interface AuditEvent {
  _id: string;
  actorId?: string | {
    _id?: string;
    name?: string;
    email?: string;
    role?: Role;
  };
  actorRole: string;
  eventType: string;
  recordType: string;
  recordId: string | Record<string, unknown>;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  timestamp: string;
  source?: 'online' | 'offline-sync';
}

export interface AnalyticsMetrics {
  period?: {
    from: string;
    to: string;
  };
  avgReferralResponseSeconds: number;
  avgTimeToDestinationConfirmSeconds: number;
  pendingReferrals: number;
  rejectedReferrals: number;
  resourceFreshnessRate: number;
  workflowCompletionRate: number;
  syncSummary?: Record<string, number>;
  note?: string;
}

export interface ApiPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  pages?: number;
}

export interface ApiErrorBody {
  code?: string;
  message?: string;
  details?: Array<{ field?: string; message?: string }>;
}
