import React from 'react';
import { CogIcon } from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">
          Configurações do sistema e preferências
        </p>
      </div>

      {/* Content */}
      <div className="text-center py-12">
        <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Configurações em Desenvolvimento</h3>
        <p className="mt-1 text-sm text-gray-500">
          Painel de configurações está sendo implementado
        </p>
      </div>
    </div>
  );
};

export default Settings;
