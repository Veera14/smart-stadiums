/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'fan' | 'staff';

export interface Match {
  id: string;
  teams: string;
  dateTime: string;
  stage: string;
  score?: string;
  attendance?: number;
}

export interface Stadium {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  matches: Match[];
  gates: string[];
}

export type IncidentType = 'cleaning' | 'security' | 'medical' | 'accessibility' | 'infrastructure' | 'other';

export interface Incident {
  id: string;
  section: string;
  type: IncidentType;
  description: string;
  reportedAt: string;
  status: 'pending' | 'dispatched' | 'resolved';
  originalLanguage: string;
  translatedDescription?: string;
  suggestedAction?: string;
}

export type SensorType = 'gate' | 'concourse' | 'concession' | 'restroom' | 'transport';

export interface SensorData {
  id: string;
  label: string;
  type: SensorType;
  value: number; // occupancy % for gates/concourse, queue minutes for concessions/restrooms, delay minutes for transport
  status: 'normal' | 'warning' | 'critical';
  lastUpdated: string;
  location: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface OperationalMetrics {
  totalAttendance: number;
  activeIncidents: number;
  avgConcessionQueue: number; // minutes
  avgGateEntryTime: number; // minutes
  transportShuttleStatus: string;
}

export interface OperationalAnalysisResult {
  safetyRating: number;
  concourseStatus: string;
  gateStatus: string;
  transportStatus: string;
  executiveSummary: string;
  topAlerts: string[];
  recommendations: Array<{
    title: string;
    action: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
  }>;
}

