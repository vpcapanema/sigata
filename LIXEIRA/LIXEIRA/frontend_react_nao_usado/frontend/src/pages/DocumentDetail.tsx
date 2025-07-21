import React from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';

const DocumentDetail: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Detalhes do Documento</h1>
        <p className="text-gray-600 mt-1">
          Visualização detalhada e análises do documento
        </p>
      </div>

      {/* Content */}
      <div className="text-center py-12">
        <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Visualização em Desenvolvimento</h3>
        <p className="mt-1 text-sm text-gray-500">
          Visualizador de documentos está sendo implementado
        </p>
      </div>
    </div>
  );
};

export default DocumentDetail;
