// SIGATA - Sistema Integrado de Gestão de Atas
// Types and interfaces for the system

export enum UserRole {
  ADMIN = 'ADMIN',
  GESTOR = 'GESTOR',
  ANALISTA = 'ANALISTA',
  OPERADOR = 'OPERADOR',
  VISUALIZADOR = 'VISUALIZADOR'
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
  status: 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO' | 'REJEITADO';
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
  PENDENTE = 'PENDENTE',
  PROCESSANDO = 'PROCESSANDO',
  CONCLUIDO = 'CONCLUIDO',
  ERRO = 'ERRO',
  REJEITADO = 'REJEITADO'
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
    label: 'POSITIVO' | 'NEGATIVO' | 'NEUTRO';
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
