import React from 'react';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const Reports: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-600 mt-1">
          Relatórios e métricas do sistema
        </p>
      </div>

      {/* Content */}
      <div className="text-center py-12">
        <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Relatórios em Desenvolvimento</h3>
        <p className="mt-1 text-sm text-gray-500">
          Sistema de relatórios está sendo implementado
        </p>
      </div>
    </div>
  );
};

export default Reports;
