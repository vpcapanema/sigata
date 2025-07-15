import { apiService } from './api';
import { 
  UploadedAta, 
  UploadDocumentoForm, 
  FiltrosDocumentos, 
  ApiResponse, 
  PaginatedResponse 
} from '@/types';

export class DocumentService {
  // Listar documentos com paginação e filtros
  async listarDocumentos(filtros: FiltrosDocumentos = {}): Promise<ApiResponse<PaginatedResponse<UploadedAta>>> {
    const params = new URLSearchParams();
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return apiService.getPaginated<UploadedAta>(`/documents?${params.toString()}`);
  }

  // Obter documento por ID
  async obterDocumento(id: string): Promise<ApiResponse<UploadedAta>> {
    return apiService.get<UploadedAta>(`/documents/${id}`);
  }

  // Upload de documento
  async uploadDocumento(
    dados: UploadDocumentoForm, 
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<UploadedAta>> {
    const formData = new FormData();
    
    formData.append('arquivo', dados.arquivo);
    formData.append('titulo_documento', dados.titulo_documento);
    formData.append('tipo_documento', dados.tipo_documento);
    
    if (dados.subtipo_documento) {
      formData.append('subtipo_documento', dados.subtipo_documento);
    }
    
    if (dados.categoria) {
      formData.append('categoria', dados.categoria);
    }
    
    if (dados.descricao) {
      formData.append('descricao', dados.descricao);
    }
    
    if (dados.palavras_chave) {
      formData.append('palavras_chave', JSON.stringify(dados.palavras_chave));
    }

    return apiService.upload<UploadedAta>('/documents/upload', formData, onProgress);
  }

  // Processar documento (análise NLP)
  async processarDocumento(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiService.post<{ message: string }>(`/documents/${id}/process`);
  }

  // Reprocessar documento
  async reprocessarDocumento(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiService.post<{ message: string }>(`/documents/${id}/reprocess`);
  }

  // Validar documento
  async validarDocumento(
    id: string, 
    validacao: 'VALIDADO' | 'REJEITADO', 
    observacoes?: string
  ): Promise<ApiResponse<UploadedAta>> {
    return apiService.put<UploadedAta>(`/documents/${id}/validate`, {
      status_validacao: validacao,
      observacoes_validacao: observacoes,
    });
  }

  // Atualizar metadados do documento
  async atualizarDocumento(
    id: string, 
    dados: Partial<Pick<UploadedAta, 'titulo_documento' | 'tipo_documento' | 'subtipo_documento' | 'categoria' | 'descricao' | 'palavras_chave'>>
  ): Promise<ApiResponse<UploadedAta>> {
    return apiService.put<UploadedAta>(`/documents/${id}`, dados);
  }

  // Excluir documento (soft delete)
  async excluirDocumento(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiService.delete<{ message: string }>(`/documents/${id}`);
  }

  // Download do arquivo original
  async downloadArquivo(id: string, filename?: string): Promise<void> {
    return apiService.download(`/documents/${id}/download`, filename);
  }

  // Obter texto extraído
  async obterTextoExtraido(id: string): Promise<ApiResponse<{ texto: string }>> {
    return apiService.get<{ texto: string }>(`/documents/${id}/text`);
  }

  // Obter estatísticas de documentos
  async obterEstatisticas(): Promise<ApiResponse<{
    total: number;
    por_status: Record<string, number>;
    por_tipo: Record<string, number>;
    por_mes: Record<string, number>;
    tempo_medio_processamento: number;
    taxa_sucesso: number;
  }>> {
    return apiService.get('/documents/stats');
  }

  // Buscar documentos por texto
  async buscarPorTexto(
    query: string, 
    limite: number = 10
  ): Promise<ApiResponse<UploadedAta[]>> {
    return apiService.get<UploadedAta[]>(`/documents/search`, {
      params: { q: query, limit: limite }
    });
  }

  // Obter versões de um documento
  async obterVersoes(id: string): Promise<ApiResponse<UploadedAta[]>> {
    return apiService.get<UploadedAta[]>(`/documents/${id}/versions`);
  }

  // Criar nova versão
  async criarVersao(
    documentoPaiId: string, 
    dados: UploadDocumentoForm
  ): Promise<ApiResponse<UploadedAta>> {
    const formData = new FormData();
    formData.append('arquivo', dados.arquivo);
    formData.append('documento_pai_id', documentoPaiId);
    formData.append('titulo_documento', dados.titulo_documento);
    formData.append('tipo_documento', dados.tipo_documento);
    
    return apiService.upload<UploadedAta>('/documents/version', formData);
  }

  // Comparar documentos
  async compararDocumentos(
    id1: string, 
    id2: string
  ): Promise<ApiResponse<{
    similaridade: number;
    diferencas: string[];
    metricas_comparacao: Record<string, any>;
  }>> {
    return apiService.get(`/documents/compare/${id1}/${id2}`);
  }

  // Análise batch de múltiplos documentos
  async processarBatch(ids: string[]): Promise<ApiResponse<{ processados: number; erros: string[] }>> {
    return apiService.post('/documents/batch/process', { document_ids: ids });
  }
}

export const documentService = new DocumentService();
