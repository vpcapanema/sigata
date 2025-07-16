import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  ClipboardDocumentListIcon,
  CogIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Documentos', href: '/documents', icon: DocumentTextIcon },
  { name: 'Análises', href: '/analysis', icon: ChartBarIcon },
  { name: 'Relatórios', href: '/reports', icon: ClipboardDocumentListIcon },
  { name: 'Configurações', href: '/settings', icon: CogIcon },
  { name: 'Perfil', href: '/profile', icon: UserIcon },
];

const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="bg-blue-600 rounded-lg p-2">
            <DocumentTextIcon className="h-8 w-8 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">SIGATA</h1>
            <p className="text-sm text-gray-500">PLI São Paulo</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          <p>SIGATA v1.0.0</p>
          <p>PLI São Paulo</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
