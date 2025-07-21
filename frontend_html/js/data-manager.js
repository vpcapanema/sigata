// ==========================================
// Utilitários para Gerenciamento de Dados
// Sistema Integrado de Gestão de Atas - SIGATA
// ==========================================

class DataManager {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }

    // ========== CACHE MANAGEMENT ==========
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }

    // ========== DOCUMENTS MANAGEMENT ========== 
    async loadDocuments(filters = {}) {
        const cacheKey = `documents_full_view_${JSON.stringify(filters)}`;
        let documents = this.getCache(cacheKey);
        if (!documents) {
            try {
                // Endpoint da view agregada
                const response = await sigataAPI.request('/documents/full-view');
                let rawDocs = [];
                if (Array.isArray(response)) {
                    rawDocs = response;
                } else if (response.data && Array.isArray(response.data)) {
                    rawDocs = response.data;
                } else if (response.documents && Array.isArray(response.documents)) {
                    rawDocs = response.documents;
                }
                // Nenhum log necessário
                // Mapeamento completo dos campos da view para o frontend
                documents = rawDocs.map(doc => ({
                    documento_id: doc.documento_id,
                    codigo_documento: doc.codigo_documento,
                    nome_arquivo: doc.nome_arquivo,
                    tipo_documento: doc.tipo_documento,
                    subtipo_documento: doc.subtipo_documento,
                    categoria: doc.categoria,
                    descricao: doc.descricao,
                    palavras_chave: doc.palavras_chave,
                    usuario_upload_id: doc.usuario_upload_id,
                    usuario_upload_username: doc.usuario_upload_username,
                    data_upload: doc.data_upload,
                    status_documento: doc.status_documento,
                    data_inicio_processamento: doc.data_inicio_processamento,
                    data_fim_processamento: doc.data_fim_processamento,
                    documento_data_criacao: doc.documento_data_criacao,
                    documento_data_atualizacao: doc.documento_data_atualizacao,
                    data_atualizacao: doc.data_atualizacao, // Garantir que este campo seja mapeado corretamente
                    arquivo_documento_id: doc.arquivo_documento_id,
                    nome_arquivo_original: doc.nome_arquivo_original,
                    caminho_arquivo: doc.caminho_arquivo,
                    hash_arquivo: doc.hash_arquivo,
                    tamanho_arquivo_bytes: doc.tamanho_arquivo_bytes,
                    mimetype: doc.mimetype,
                    ata_dados_id: doc.ata_dados_id,
                    titulo_reuniao: doc.titulo_reuniao,
                    data_reuniao: doc.data_reuniao,
                    local_reuniao: doc.local_reuniao,
                    organizacao_responsavel: doc.organizacao_responsavel,
                    tipo_reuniao: doc.tipo_reuniao,
                    status_reuniao: doc.status_reuniao,
                    numero_participantes: doc.numero_participantes,
                    duracao_estimada: doc.duracao_estimada,
                    observacoes_gerais: doc.observacoes_gerais,
                    ata_data_extracao: doc.ata_data_extracao,
                    qualidade_id: doc.qualidade_id,
                    pontuacao_legibilidade: doc.pontuacao_legibilidade,
                    pontuacao_estrutura: doc.pontuacao_estrutura,
                    pontuacao_completude: doc.pontuacao_completude,
                    pontuacao_coerencia: doc.pontuacao_coerencia,
                    pontuacao_geral: doc.pontuacao_geral,
                    nivel_confianca: doc.nivel_confianca,
                    observacoes_qualidade: doc.observacoes_qualidade,
                    metrica_palavras_total: doc.metrica_palavras_total,
                    metrica_paragrafos_total: doc.metrica_paragrafos_total,
                    metrica_sentencas_total: doc.metrica_sentencas_total,
                    qualidade_data_avaliacao: doc.qualidade_data_avaliacao,
                    nlp_dados_id: doc.nlp_dados_id,
                    idioma_detectado: doc.idioma_detectado,
                    palavras_chave_nlp: doc.palavras_chave_nlp,
                    entidades_nomeadas: doc.entidades_nomeadas,
                    topicos_principais: doc.topicos_principais,
                    resumo_automatico: doc.resumo_automatico,
                    sentimento_geral: doc.sentimento_geral,
                    pontuacao_sentimento: doc.pontuacao_sentimento,
                    nivel_formalidade: doc.nivel_formalidade,
                    complexidade_linguistica: doc.complexidade_linguistica,
                    nlp_data_processamento: doc.nlp_data_processamento,
                    nlp_metricas_id: doc.nlp_metricas_id,
                    densidade_palavras_chave: doc.densidade_palavras_chave,
                    diversidade_lexical: doc.diversidade_lexical,
                    coesao_textual: doc.coesao_textual,
                    indice_legibilidade: doc.indice_legibilidade,
                    frequencia_termos_tecnicos: doc.frequencia_termos_tecnicos,
                    pontuacao_objetividade: doc.pontuacao_objetividade,
                    indice_redundancia: doc.indice_redundancia,
                    metricas_adicionais: doc.metricas_adicionais,
                    metricas_data_calculo: doc.metricas_data_calculo,
                    status_processamento_completo: doc.status_processamento_completo,
                    tem_arquivo: doc.tem_arquivo,
                    tem_dados_ata: doc.tem_dados_ata,
                    tem_avaliacao_qualidade: doc.tem_avaliacao_qualidade,
                    tem_processamento_nlp: doc.tem_processamento_nlp,
                    tem_metricas_nlp: doc.tem_metricas_nlp,
                    tamanho_arquivo: doc.tamanho_arquivo,
                    ultima_atualizacao: doc.ultima_atualizacao
                }));
                this.setCache(cacheKey, documents);
            } catch (error) {
                console.error('Erro ao carregar documentos:', error);
                documents = [];
            }
        }
        return documents;
    }

    // ========== METRICS MANAGEMENT ==========
    async loadMetrics(period = '30d') {
        const cacheKey = `metrics_${period}`;
        let metrics = this.getCache(cacheKey);
        
        if (!metrics) {
            try {
                metrics = await sigataAPI.getMetrics(period);
                this.setCache(cacheKey, metrics);
            } catch (error) {
                console.error('Erro ao carregar métricas:', error);
                metrics = this.getFallbackMetrics();
            }
        }
        
        return metrics;
    }

    getFallbackMetrics() {
        return {
            documents: {
                total: 15,
                processed: 12,
                pending: 2,
                error: 1
            },
            analyses: {
                total: 12,
                completed: 10,
                processing: 2,
                failed: 0
            },
            reports: {
                generated: 10,
                downloaded: 25,
                shared: 8
            },
            system: {
                avg_processing_time: 150, // segundos
                success_rate: 92.3, // porcentagem
                storage_used: 1.2, // GB
                api_calls_today: 127
            }
        };
    }

    // ========== UTILITY FUNCTIONS ==========
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        
        // Check if the date is already in the format DD/MM/YYYY HH24:MI:SS
        if (typeof dateString === 'string' && dateString.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/)) {
            // Extract parts from the formatted string
            const [datePart, timePart] = dateString.split(' ');
            const [hours, minutes] = timePart.split(':');
            // Return in the format DD/MM/YYYY HHhMMm
            return `${datePart} ${hours}h${minutes}m`;
        }
        
        // Handle date object or other formats
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        // Formato: 20/07/2025 23h30m
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const ano = date.getFullYear();
        const hora = String(date.getHours()).padStart(2, '0');
        const minuto = String(date.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${ano} ${hora}h${minuto}m`;
    }

    getStatusBadge(status) {
        const statusMap = {
            'PENDENTE': '<span class="badge bg-secondary">Pendente</span>',
            'PROCESSANDO': '<span class="badge bg-warning">Processando</span>',
            'CONCLUIDO': '<span class="badge bg-success">Concluído</span>',
            'ERRO': '<span class="badge bg-danger">Erro</span>',
            'REJEITADO': '<span class="badge bg-danger">Rejeitado</span>'
        };
        return statusMap[status] || '<span class="badge bg-light text-dark">Desconhecido</span>';
    }

    getFileIcon(fileType) {
        if (fileType.includes('pdf')) {
            return 'fa-file-pdf';
        } else if (fileType.includes('word') || fileType.includes('docx')) {
            return 'fa-file-word';
        } else if (fileType.includes('text') || fileType.includes('txt')) {
            return 'fa-file-alt';
        } else {
            return 'fa-file';
        }
    }

    getFileColor(fileType) {
        if (fileType.includes('pdf')) {
            return 'text-danger';
        } else if (fileType.includes('word') || fileType.includes('docx')) {
            return 'text-primary';
        } else if (fileType.includes('text') || fileType.includes('txt')) {
            return 'text-secondary';
        } else {
            return 'text-muted';
        }
    }

    // ========== NOTIFICATIONS ==========
    showNotification(type, message, duration = 5000) {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0 mb-2`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Inicializar toast do Bootstrap
        const bsToast = new bootstrap.Toast(toast, { delay: duration });
        bsToast.show();
        
        // Remover após ocultar
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
        return container;
    }
}

// Instância global do DataManager
window.dataManager = new DataManager();
