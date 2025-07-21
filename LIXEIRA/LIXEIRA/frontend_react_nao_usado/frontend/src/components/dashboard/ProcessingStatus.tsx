import React from 'react';
import { DashboardMetrics } from '@/types';

interface ProcessingStatusProps {
  metrics: DashboardMetrics | null;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando dados...</p>
      </div>
    );
  }

  const total = metrics.total_documentos;
  const data = [
    { 
      label: 'Concluídos', 
      value: metrics.documentos_processados, 
      color: 'bg-green-500',
      percentage: total > 0 ? ((metrics.documentos_processados / total) * 100).toFixed(1) : '0'
    },
    { 
      label: 'Pendentes', 
      value: metrics.documentos_pendentes, 
      color: 'bg-yellow-500',
      percentage: total > 0 ? ((metrics.documentos_pendentes / total) * 100).toFixed(1) : '0'
    },
    { 
      label: 'Com Erro', 
      value: metrics.documentos_erro, 
      color: 'bg-red-500',
      percentage: total > 0 ? ((metrics.documentos_erro / total) * 100).toFixed(1) : '0'
    }
  ];

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">{item.value}</div>
            <div className="text-xs text-gray-500">{item.percentage}%</div>
          </div>
        </div>
      ))}
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">Total de Documentos:</span>
          <span className="font-semibold text-gray-900">{total}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="font-medium text-gray-700">Taxa de Sucesso:</span>
          <span className="font-semibold text-green-600">{metrics.taxa_sucesso}%</span>
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus;
