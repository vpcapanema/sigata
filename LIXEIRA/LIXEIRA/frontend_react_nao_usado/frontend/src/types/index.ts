// Tipos para o sistema SIGATA baseados na estrutura do banco PostgreSQL

// Status de processamento
export type StatusProcessamento = 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO' | 'REJEITADO';
export type StatusValidacao = 'PENDENTE' | 'VALIDADO' | 'REJEITADO';
export type TipoDocumento = 'ATA' | 'RELATORIO' | 'CONTRATO' | 'OFICIO' | 'MEMORANDO' | 'OUTROS';
export type TipoUsuario = 'ADMIN' | 'GESTOR' | 'ANALISTA' | 'OPERADOR' | 'VISUALIZADOR';

// Pessoa Física
export interface PessoaFisica {
  id: string;
  cpf: string;
  nome_completo: string;
  nome_social?: string;
  data_nascimento?: string;
  sexo?: 'M' | 'F' | 'O';
  estado_civil?: 'SOLTEIRO' | 'CASADO' | 'DIVORCIADO' | 'VIUVO' | 'UNIAO_ESTAVEL';
  nacionalidade?: string;
  naturalidade?: string;
  rg?: string;
  orgao_expeditor?: string;
  uf_rg?: string;
  data_expedicao_rg?: string;
  pis_pasep?: string;
  titulo_eleitor?: string;
  zona_eleitoral?: string;
  secao_eleitoral?: string;
  email?: string;
  telefone_principal?: string;
  telefone_secundario?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  profissao?: string;
  escolaridade?: 'FUNDAMENTAL' | 'MEDIO' | 'SUPERIOR' | 'POS_GRADUACAO' | 'MESTRADO' | 'DOUTORADO';
  renda_mensal?: number;
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
  data_exclusao?: string;
}

// Pessoa Jurídica
export interface PessoaJuridica {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  porte_empresa?: 'MEI' | 'ME' | 'EPP' | 'MEDIO' | 'GRANDE';
  natureza_juridica?: string;
  cnae_principal?: string;
  email?: string;
  telefone?: string;
  site?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  situacao_receita?: string;
  data_abertura?: string;
  data_criacao: string;
  data_atualizacao: string;
  data_exclusao?: string;
}

// Usuario Sistema
export interface UsuarioSistema {
  id: string;
  username: string;
  email: string;
  senha_hash: string;
  salt?: string;
  duplo_fator_habilitado: boolean;
  duplo_fator_chave_secreta?: string;
  pessoa_fisica_id?: string;
  pessoa_juridica_id?: string;
  tipo_usuario: TipoUsuario;
  nivel_acesso: number;
  departamento?: string;
  cargo?: string;
  ativo: boolean;
  email_verificado: boolean;
  primeiro_acesso: boolean;
  data_ultimo_login?: string;
  tentativas_login: number;
  bloqueado_ate?: string;
  fuso_horario: string;
  idioma: string;
  tema_interface: string;
  data_criacao: string;
  data_atualizacao: string;
  criado_por_id?: string;
  data_exclusao?: string;
  // Relacionamentos
  pessoa_fisica?: PessoaFisica;
  pessoa_juridica?: PessoaJuridica;
  criado_por?: UsuarioSistema;
}

// Métricas NLP
export interface MetricasNLP {
  // BERTopic
  metrica_coerencia?: number;
  metrica_silhueta?: number;
  metrica_diversidade_topicos?: number;
  quantidade_topicos?: number;
  topicos_principais?: Record<string, any>;
  
  // KeyBERT
  metrica_relevancia_marginal?: number;
  metrica_similaridade?: number;
  nlp_palavras_chave?: Record<string, any>;
  nlp_relevancia_ngramas?: Record<string, any>;
  
  // BERTScore
  bert_precisao?: number;
  bert_revocacao?: number;
  bert_pontuacao_f1?: number;
  
  // Performance
  metrica_performance?: number;
  intervalo_confianca_95?: number;
}

// Ações extraídas de atas
export interface AcaoExtraida {
  acao: string;
  responsavel: string;
  prazo?: string;
}

// Entidades extraídas
export interface EntidadesExtraidas {
  pessoas: string[];
  organizacoes: string[];
  locais: string[];
  datas: string[];
}

// Documento/Ata Uploaded
export interface UploadedAta {
  id: string;
  codigo_documento: string;
  tipo_documento: TipoDocumento;
  subtipo_documento?: string;
  categoria?: string;
  titulo_documento: string;
  descricao?: string;
  palavras_chave?: string[];
  
  // Arquivo
  nome_arquivo_original: string;
  caminho_arquivo: string;
  arquivo_texto_extraido?: string;
  arquivo_metadados?: Record<string, any>;
  tamanho_arquivo_bytes?: number;
  tipo_mime?: string;
  hash_arquivo?: string;
  
  // Upload
  data_upload: string;
  usuario_upload_id: string;
  endereco_ip_upload?: string;
  agente_usuario?: string;
  
  // Processamento
  status_processamento: StatusProcessamento;
  data_inicio_processamento?: string;
  data_fim_processamento?: string;
  tempo_processamento_ms?: number;
  
  // NLP Básico
  nlp_processado: boolean;
  nlp_idioma_detectado?: string;
  nlp_confianca_idioma?: number;
  
  // Métricas BERTopic
  metrica_coerencia?: number;
  metrica_silhueta?: number;
  metrica_diversidade_topicos?: number;
  quantidade_topicos?: number;
  topicos_principais?: Record<string, any>;
  
  // Métricas KeyBERT
  metrica_relevancia_marginal?: number;
  metrica_similaridade?: number;
  nlp_palavras_chave?: Record<string, any>;
  nlp_relevancia_ngramas?: Record<string, any>;
  
  // Métricas BERTScore
  bert_precisao?: number;
  bert_revocacao?: number;
  bert_pontuacao_f1?: number;
  
  // Performance
  metrica_performance?: number;
  intervalo_confianca_95?: number;
  
  // Sentimento
  nlp_sentimento_geral?: 'POSITIVO' | 'NEUTRO' | 'NEGATIVO';
  nlp_pontuacao_sentimento?: number;
  
  // Entidades
  nlp_entidades_extraidas?: EntidadesExtraidas;
  participantes_extraidos?: string[];
  
  // Informações de Ata
  data_reuniao?: string;
  hora_inicio_reuniao?: string;
  hora_fim_reuniao?: string;
  local_reuniao?: string;
  decisoes_extraidas?: string[];
  acoes_extraidas?: AcaoExtraida[];
  
  // Qualidade
  taxa_conversao?: number;
  qualidade_texto?: number;
  segmentacao_score?: number;
  legibilidade_score?: number;
  completude_informacoes?: number;
  
  // Estrutura
  quantidade_paginas?: number;
  quantidade_palavras?: number;
  quantidade_caracteres?: number;
  quantidade_paragrafos?: number;
  
  // Sistema
  quantidade_tentativas_processamento: number;
  tempo_total_processamento_ms?: number;
  memoria_utilizada_mb?: number;
  cpu_utilizada_percentual?: number;
  modelo_bert_utilizado?: string;
  versoes_algoritmos?: Record<string, any>;
  
  // Resumo
  nlp_resumo_automatico?: string;
  nlp_palavras_frequentes?: Record<string, number>;
  
  // Controle
  versao_documento: number;
  documento_pai_id?: string;
  
  // Validação
  status_validacao: StatusValidacao;
  validado_por_id?: string;
  data_validacao?: string;
  observacoes_validacao?: string;
  
  // Relacionamentos
  usuario_upload?: UsuarioSistema;
  validado_por?: UsuarioSistema;
  documento_pai?: UploadedAta;
}

// Relatório de Atas
export interface RelatorioAtas {
  id: string;
  titulo_relatorio: string;
  descricao?: string;
  tipo_relatorio: string;
  periodo_inicio: string;
  periodo_fim: string;
  filtros_aplicados?: Record<string, any>;
  total_documentos: number;
  total_palavras: number;
  total_participantes: number;
  metricas_consolidadas?: Record<string, any>;
  grafico_dados?: Record<string, any>;
  status_geracao: 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO';
  data_geracao: string;
  gerado_por_id: string;
  data_criacao: string;
  data_atualizacao: string;
  // Relacionamentos
  gerado_por?: UsuarioSistema;
}

// Tipos para API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para formulários
export interface UploadDocumentoForm {
  arquivo: File;
  titulo_documento: string;
  tipo_documento: TipoDocumento;
  subtipo_documento?: string;
  categoria?: string;
  descricao?: string;
  palavras_chave?: string[];
}

export interface FiltrosDocumentos {
  status?: StatusProcessamento;
  tipo_documento?: TipoDocumento;
  data_inicio?: string;
  data_fim?: string;
  usuario_upload_id?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardMetrics {
  total_documentos: number;
  documentos_processados: number;
  documentos_pendentes: number;
  documentos_erro: number;
  taxa_sucesso: number;
  tempo_medio_processamento: number;
  atas_mes_atual: number;
  crescimento_mensal: number;
}
