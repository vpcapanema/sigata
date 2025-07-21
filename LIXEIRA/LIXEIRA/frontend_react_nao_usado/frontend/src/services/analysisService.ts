import { apiService } from './api';
import { 
  UploadedAta, 
  RelatorioAtas,
  DashboardMetrics,
  ApiResponse, 
  PaginatedResponse 
} from '@/types';

export class AnalysisService {
  // Obter análise de um documento
  async obterAnalise(documentoId: string): Promise<ApiResponse<UploadedAta>> {
    return apiService.get<UploadedAta>(`/analysis/${documentoId}`);
  }

  // Solicitar nova análise
  async solicitarAnalise(documentoId: string, parametros?: {
    reprocessar?: boolean;
    modelo_bert?: string;
    extrair_entidades?: boolean;
    analise_sentimento?: boolean;
    extrair_topicos?: boolean;
  }): Promise<ApiResponse<{ message: string; analysis_id: string }>> {
    return apiService.post(`/analysis`, {
      document_id: documentoId,
      ...parametros
    });
  }

  // Listar análises com filtros
  async listarAnalises(filtros: {
    status?: string;
    data_inicio?: string;
    data_fim?: string;
    tipo_documento?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<PaginatedResponse<UploadedAta>>> {
    const params = new URLSearchParams();
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return apiService.getPaginated<UploadedAta>(`/analysis?${params.toString()}`);
  }

  // Obter métricas consolidadas
  async obterMetricasConsolidadas(filtros?: {
    data_inicio?: string;
    data_fim?: string;
    tipo_documento?: string;
  }): Promise<ApiResponse<{
    total_documentos: number;
    media_coerencia: number;
    media_f1_score: number;
    media_similaridade: number;
    media_performance: number;
    distribuicao_sentimentos: Record<string, number>;
    topicos_frequentes: Array<{ topico: string; frequencia: number }>;
    entidades_frequentes: Record<string, string[]>;
    metricas_qualidade: {
      taxa_conversao_media: number;
      qualidade_texto_media: number;
      legibilidade_media: number;
      completude_media: number;
    };
  }>> {
    const params = new URLSearchParams();
    
    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    return apiService.get(`/analysis/metrics${params.toString() ? '?' + params.toString() : ''}`);
  }

  // Comparar análises entre documentos
  async compararAnalises(documentoIds: string[]): Promise<ApiResponse<{
    documentos: UploadedAta[];
    comparacao: {
      similaridade_matriz: number[][];
      topicos_comuns: string[];
      entidades_comuns: Record<string, string[]>;
      diferenca_sentimentos: Record<string, number>;
      metricas_comparativas: Record<string, number[]>;
    };
  }>> {
    return apiService.post('/analysis/compare', { document_ids: documentoIds });
  }

  // Análise de tendências temporais
  async analiseTendencias(filtros?: {
    data_inicio?: string;
    data_fim?: string;
    granularidade?: 'dia' | 'semana' | 'mes';
  }): Promise<ApiResponse<{
    timeline: Array<{
      periodo: string;
      total_documentos: number;
      media_performance: number;
      sentimento_predominante: string;
      topicos_principais: string[];
    }>;
    tendencias: {
      crescimento_volume: number;
      evolucao_qualidade: number;
      mudanca_sentimentos: Record<string, number>;
    };
  }>> {
    const params = new URLSearchParams();
    
    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    return apiService.get(`/analysis/trends${params.toString() ? '?' + params.toString() : ''}`);
  }

  // Análise de rede de participantes
  async analiseRedeParticipantes(filtros?: {
    data_inicio?: string;
    data_fim?: string;
    min_participacoes?: number;
  }): Promise<ApiResponse<{
    participantes: Array<{
      nome: string;
      total_participacoes: number;
      documentos: string[];
      conexoes: Array<{ nome: string; peso: number }>;
    }>;
    rede: {
      nodes: Array<{ id: string; nome: string; peso: number }>;
      edges: Array<{ source: string; target: string; peso: number }>;
    };
    metricas_rede: {
      densidade: number;
      centralidade_media: number;
      clusters: number;
    };
  }>> {
    const params = new URLSearchParams();
    
    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    return apiService.get(`/analysis/network${params.toString() ? '?' + params.toString() : ''}`);
  }

  // Análise de tópicos avançada
  async analiseTopicosAvancada(parametros?: {
    num_topicos?: number;
    algoritmo?: 'bertopic' | 'lda' | 'nmf';
    min_cluster_size?: number;
    data_inicio?: string;
    data_fim?: string;
  }): Promise<ApiResponse<{
    topicos: Array<{
      id: number;
      palavras_chave: string[];
      documentos: string[];
      peso: number;
      coerencia: number;
    }>;
    visualizacao: {
      clusters_2d: Array<{ x: number; y: number; topico: number; documento_id: string }>;
      matriz_similaridade: number[][];
    };
    metricas: {
      coerencia_geral: number;
      diversidade: number;
      estabilidade: number;
    };
  }>> {
    return apiService.post('/analysis/topics', parametros);
  }

  // Exportar resultados de análise
  async exportarAnalise(
    documentoId: string, 
    formato: 'json' | 'xlsx' | 'pdf' | 'csv'
  ): Promise<void> {
    return apiService.download(`/analysis/${documentoId}/export/${formato}`);
  }

  // Feedback sobre análise
  async enviarFeedback(documentoId: string, feedback: {
    qualidade_resumo: number; // 1-5
    qualidade_palavras_chave: number; // 1-5
    qualidade_entidades: number; // 1-5
    qualidade_sentimento: number; // 1-5
    comentarios?: string;
    sugestoes_melhoria?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiService.post(`/analysis/${documentoId}/feedback`, feedback);
  }

  // Status de processamento em tempo real
  async obterStatusProcessamento(documentoId: string): Promise<ApiResponse<{
    status: string;
    progresso: number;
    etapa_atual: string;
    tempo_estimado: number;
    detalhes: Record<string, any>;
  }>> {
    return apiService.get(`/analysis/${documentoId}/status`);
  }

  // Cancelar processamento
  async cancelarProcessamento(documentoId: string): Promise<ApiResponse<{ message: string }>> {
    return apiService.post(`/analysis/${documentoId}/cancel`);
  }
}

export const analysisService = new AnalysisService();
