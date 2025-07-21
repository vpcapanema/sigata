import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const Analysis: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Análises NLP</h1>
        <p className="text-gray-600 mt-1">
          Resultados de processamento de linguagem natural
        </p>
      </div>

      {/* Content */}
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Análises em Desenvolvimento</h3>
        <p className="mt-1 text-sm text-gray-500">
          Os serviços de análise NLP estão sendo implementados
        </p>
      </div>
    </div>
  );
};

export default Analysis;
