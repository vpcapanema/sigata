import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

// Types
import { DashboardMetrics, UploadedAta } from '@/types';

// Services
import { documentService } from '@/services/documentService';

// Components
import MetricCard from '@/components/dashboard/MetricCard';
import RecentDocuments from '@/components/dashboard/RecentDocuments';
//import RecentDocuments from '@/components/dashboard/RecentDocuments';
import ProcessingStatus from '@/components/dashboard/ProcessingStatus';
import AnalysisChart from '@/components/dashboard/AnalysisChart';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<UploadedAta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar métricas
      const [metricsResponse, documentsResponse] = await Promise.all([
        documentService.obterEstatisticas(),
        documentService.listarDocumentos({ limit: 5, sortBy: 'data_upload', sortOrder: 'desc' })
      ]);

      if (metricsResponse.success && metricsResponse.data) {
        // Converter para formato DashboardMetrics
        const metricsData: DashboardMetrics = {
          total_documentos: metricsResponse.data.total,
          documentos_processados: metricsResponse.data.por_status['CONCLUIDO'] || 0,
          documentos_pendentes: metricsResponse.data.por_status['PENDENTE'] || 0,
          documentos_erro: metricsResponse.data.por_status['ERRO'] || 0,
          taxa_sucesso: metricsResponse.data.taxa_sucesso,
          tempo_medio_processamento: metricsResponse.data.tempo_medio_processamento,
          atas_mes_atual: Object.values(metricsResponse.data.por_mes).reduce((a, b) => a + (b as number), 0),
          crescimento_mensal: 15.2 // Placeholder - calcular baseado nos dados reais
        };
        setMetrics(metricsData);
      }

      if (documentsResponse.success && documentsResponse.data) {
        setRecentDocuments(documentsResponse.data.data);
      }

    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-600">Carregando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">Erro ao carregar dashboard</h3>
        <p className="text-red-700">{error}</p>
        <button 
          onClick={loadDashboardData}
          className="mt-4 btn-primary"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard SIGATA</h1>
        <p className="text-gray-600 mt-1">
          Visão geral do sistema de gestão de atas - PLI São Paulo
        </p>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Documentos"
          value={metrics?.total_documentos || 0}
          icon={DocumentTextIcon}
          color="blue"
          change={`+${metrics?.crescimento_mensal || 0}%`}
          changeType="positive"
        />
        
        <MetricCard
          title="Processados"
          value={metrics?.documentos_processados || 0}
          icon={CheckCircleIcon}
          color="green"
          subtitle={`Taxa: ${metrics?.taxa_sucesso || 0}%`}
        />
        
        <MetricCard
          title="Pendentes"
          value={metrics?.documentos_pendentes || 0}
          icon={ClockIcon}
          color="yellow"
          subtitle="Aguardando processamento"
        />
        
        <MetricCard
          title="Com Erro"
          value={metrics?.documentos_erro || 0}
          icon={ExclamationTriangleIcon}
          color="red"
          subtitle="Requerem atenção"
        />
      </div>

      {/* Métricas secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Tempo Médio"
          value={`${Math.round((metrics?.tempo_medio_processamento || 0) / 1000)}s`}
          icon={ArrowTrendingUpIcon}
          color="purple"
          subtitle="Processamento por documento"
        />
        
        <MetricCard
          title="Atas Este Mês"
          value={metrics?.atas_mes_atual || 0}
          icon={CalendarDaysIcon}
          color="indigo"
          subtitle="Documentos carregados"
        />
        
        <MetricCard
          title="Participantes Únicos"
          value="247"
          icon={UserGroupIcon}
          color="teal"
          subtitle="Extraídos das atas"
        />
      </div>

      {/* Gráficos e tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status de processamento */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Status de Processamento</h3>
            <p className="text-sm text-gray-500">Distribuição atual dos documentos</p>
          </div>
          <ProcessingStatus metrics={metrics} />
        </div>

        {/* Análises por período */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Análises por Período</h3>
            <p className="text-sm text-gray-500">Últimos 30 dias</p>
          </div>
          <AnalysisChart />
        </div>
      </div>

      {/* Documentos recentes */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Documentos Recentes</h3>
              <p className="text-sm text-gray-500">Últimos documentos carregados no sistema</p>
            </div>
            <a 
              href="/documents" 
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Ver todos →
            </a>
          </div>
        </div>
        <RecentDocuments documents={recentDocuments} />
      </div>

      {/* Actions rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a 
          href="/documents" 
          className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
        >
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <h4 className="font-medium text-gray-900">Gerenciar Documentos</h4>
              <p className="text-sm text-gray-500">Upload e visualização</p>
            </div>
          </div>
        </a>
        
        <a 
          href="/analysis" 
          className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
        >
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-secondary-600" />
            <div className="ml-4">
              <h4 className="font-medium text-gray-900">Ver Análises</h4>
              <p className="text-sm text-gray-500">Resultados NLP</p>
            </div>
          </div>
        </a>
        
        <a 
          href="/reports" 
          className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
        >
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-8 w-8 text-accent-600" />
            <div className="ml-4">
              <h4 className="font-medium text-gray-900">Relatórios</h4>
              <p className="text-sm text-gray-500">Métricas e insights</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
};

export default Dashboard;
