import React, { useState, useEffect } from 'react';
import { 
  DocumentPlusIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  EyeIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface Document {
  id: string;
  nome: string;
  tipo: string;
  tamanho: string;
  status: 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO';
  dataUpload: string;
  dataProcessamento?: string;
}

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // Simular dados por enquanto
      setDocuments([
        {
          id: '1',
          nome: 'Ata_Reuniao_PLI_Janeiro_2025.pdf',
          tipo: 'PDF',
          tamanho: '2.4 MB',
          status: 'CONCLUIDO',
          dataUpload: '2025-07-15T10:30:00',
          dataProcessamento: '2025-07-15T10:35:00'
        },
        {
          id: '2',
          nome: 'Ata_Comissao_Fevereiro_2025.docx',
          tipo: 'DOCX',
          tamanho: '1.8 MB',
          status: 'PROCESSANDO',
          dataUpload: '2025-07-15T11:00:00'
        },
        {
          id: '3',
          nome: 'Relatorio_Atividades_Marco_2025.pdf',
          tipo: 'PDF',
          tamanho: '3.2 MB',
          status: 'PENDENTE',
          dataUpload: '2025-07-15T11:15:00'
        }
      ]);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'CONCLUIDO': return 'bg-green-100 text-green-800';
      case 'PROCESSANDO': return 'bg-blue-100 text-blue-800';
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-800';
      case 'ERRO': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-600">Carregando documentos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie e visualize documentos do sistema
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="btn-primary flex items-center">
            <DocumentPlusIcon className="h-5 w-5 mr-2" />
            Novo Upload
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button className="btn-secondary flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtros
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processamento
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((document) => (
                <tr key={document.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {document.nome}
                      </div>
                      <div className="text-sm text-gray-500">
                        {document.tipo} • {document.tamanho}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(document.status)}`}>
                      {document.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(document.dataUpload).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {document.dataProcessamento 
                      ? new Date(document.dataProcessamento).toLocaleString('pt-BR')
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                    <button 
                      className="text-blue-600 hover:text-blue-900"
                      title="Visualizar"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button 
                      className="text-green-600 hover:text-green-900"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      title="Excluir"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <DocumentPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum documento encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Tente ajustar sua busca' : 'Comece fazendo upload de um documento'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documents;
