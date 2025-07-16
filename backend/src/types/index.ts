// SIGATA - Sistema Integrado de Gestão de Atas
// Types and interfaces for the system

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  VIEWER = 'VIEWER'
}

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  preferences?: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Document {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Analysis {
  id: string;
  documentId: string;
  status: AnalysisStatus;
  result?: NLPResult;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  analyzedBy: string;
}

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  IN_PROGRESS = "IN_PROGRESS"
}

export interface NLPResult {
  summary?: string;
  keywords?: string[];
  entities?: Array<{
    text: string;
    label: string;
    confidence: number;
  }>;
  sentiment?: {
    score: number;
    magnitude: number;
    label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  };
  topics?: Array<{
    topic: string;
    relevance: number;
  }>;
  participants?: string[];
  decisions?: string[];
  actionItems?: Array<{
    item: string;
    responsible?: string;
    deadline?: string;
  }>;
  meetingData?: {
    date?: string;
    duration?: string;
    location?: string;
    attendees?: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  preferences?: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface SystemMetrics {
  totalDocuments: number;
  totalAnalyses: number;
  successRate: number;
  averageProcessingTime: number;
  documentsProcessedToday: number;
  activeUsers: number;
}
