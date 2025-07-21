// ==========================================
// Configuração da API SIGATA
// Sistema Integrado de Gestão de Atas
// ==========================================

const API_CONFIG = {
    // URL base da API (ajustar conforme ambiente)
    BASE_URL: 'http://localhost:3001',
    
    // Endpoints da API
    ENDPOINTS: {
        // Autenticação
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        ME: '/auth/me',
        
        // Usuários
        USERS: '/admin/users',
        USER_PROFILE: '/auth/me',
        
        // Documentos - Apenas os endpoints confirmados
        DOCUMENTS: '/documents',
        DOCUMENTS_UPLOAD: '/documents/upload',
        DOCUMENTS_PROCESS: '/documents/:id/process',
        DOCUMENTS_STATUS: '/documents/:id/status',
        DOCUMENTS_RESULTS: '/documents/:id/results',
        DOCUMENTS_FULL_VIEW: '/documents/full-view',
        
        // Health check
        HEALTH: '/health'
    },
    
    // Headers padrão
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    
    // Configurações de timeout
    TIMEOUT: 30000, // 30 segundos
    
    // Configurações de upload
    UPLOAD: {
        MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
        ALLOWED_TYPES: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ],
        CHUNK_SIZE: 1024 * 1024 // 1MB chunks para arquivos grandes
    }
};

// ==========================================
// Classe para gerenciar requisições da API
// ==========================================

class SigataAPI {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    // Método para fazer requisições HTTP
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                ...API_CONFIG.HEADERS,
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            timeout: API_CONFIG.TIMEOUT
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        // Remover Content-Type para FormData, deixando o navegador definir o boundary
        if (finalOptions.body instanceof FormData) {
            delete finalOptions.headers['Content-Type'];
        }

        try {
            const response = await fetch(url, finalOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Métodos específicos para recursos

    // ========== DOCUMENTOS ==========
    async getDocuments(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`${API_CONFIG.ENDPOINTS.DOCUMENTS}?${params}`);
    }

    async uploadDocument(file, metadata = {}) {
        const formData = new FormData();
        formData.append('document', file);  // Backend espera 'document'
        if (Object.keys(metadata).length > 0) {
            formData.append('metadata', JSON.stringify(metadata));
        }

        return this.request(API_CONFIG.ENDPOINTS.DOCUMENTS_UPLOAD, {
            method: 'POST',
            body: formData,
            headers: {
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            }
        });
    }

    async getDocumentStatus(documentId) {
        const endpoint = API_CONFIG.ENDPOINTS.DOCUMENTS_STATUS.replace(':id', documentId);
        return this.request(endpoint);
    }

    async deleteDocument(documentId) {
        return this.request(`${API_CONFIG.ENDPOINTS.DOCUMENTS}/${documentId}`, {
            method: 'DELETE'
        });
    }

    // ========== ANÁLISES ==========
    async getAnalyses(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`${API_CONFIG.ENDPOINTS.ANALYSES}?${params}`);
    }

    async startAnalysis(documentId, analysisType = 'basic') {
        const endpoint = API_CONFIG.ENDPOINTS.ANALYSES_START.replace(':id', documentId);
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify({ analysis_type: analysisType })
        });
    }

    async getAnalysisResult(analysisId) {
        const endpoint = API_CONFIG.ENDPOINTS.ANALYSES_RESULT.replace(':id', analysisId);
        return this.request(endpoint);
    }

    // ========== RELATÓRIOS ==========
    async getReports(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`${API_CONFIG.ENDPOINTS.REPORTS}?${params}`);
    }

    async generateReport(analysisId, format = 'html') {
        return this.request(API_CONFIG.ENDPOINTS.REPORTS_GENERATE, {
            method: 'POST',
            body: JSON.stringify({ 
                analysis_id: analysisId, 
                format: format 
            })
        });
    }

    async downloadReport(reportId) {
        const endpoint = API_CONFIG.ENDPOINTS.REPORTS_DOWNLOAD.replace(':id', reportId);
        return this.request(endpoint, {
            headers: {
                'Accept': 'application/octet-stream'
            }
        });
    }

    // ========== MÉTRICAS ==========
    async getMetrics(period = '30d') {
        return this.request(`${API_CONFIG.ENDPOINTS.METRICS}?period=${period}`);
    }

    async getSystemMetrics() {
        return this.request(API_CONFIG.ENDPOINTS.SYSTEM_METRICS);
    }

    // ========== VIEW COMPLETA DE DOCUMENTOS ==========
    async getCompleteDocumentsView() {
        try {
            return await this.request(API_CONFIG.ENDPOINTS.DOCUMENTS_FULL_VIEW);
        } catch (error) {
            console.error('Erro ao buscar view completa:', error);
            return { success: false, error: error.message };
        }
    }

    async getCompleteDocumentById(documentId) {
        try {
            return await this.request(`/documents/complete-view/${documentId}`);
        } catch (error) {
            console.error('Erro ao buscar documento completo:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Métodos removidos pois os endpoints não estão funcionando

    // ========== AUTENTICAÇÃO ==========
    async login(email, password) {
        const response = await this.request(API_CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response.token) {
            this.token = response.token;
            localStorage.setItem('authToken', response.token);
        }
        
        return response;
    }

    async logout() {
        try {
            await this.request(API_CONFIG.ENDPOINTS.LOGOUT, {
                method: 'POST'
            });
        } finally {
            this.token = null;
            localStorage.removeItem('authToken');
        }
    }

    // ========== UTILITÁRIOS ==========
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    isAuthenticated() {
        return !!this.token;
    }
}

// Instância global da API
const sigataAPI = new SigataAPI();

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, SigataAPI, sigataAPI };
}
