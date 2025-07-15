import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout Components
import DashboardLayout from './components/layout/DashboardLayout';

// Page Components
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentDetail from './pages/DocumentDetail';
import Analysis from './pages/Analysis';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';

// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute';

// Styles
import './index.css';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          {/* Rota de login */}
          <Route path="/login" element={<Login />} />
          
          {/* Rotas protegidas */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Routes>
                    {/* Dashboard */}
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Navigate to="/" replace />} />
                    
                    {/* Documentos */}
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/documents/:id" element={<DocumentDetail />} />
                    
                    {/* Análises */}
                    <Route path="/analysis" element={<Analysis />} />
                    <Route path="/analysis/:id" element={<DocumentDetail />} />
                    
                    {/* Relatórios */}
                    <Route path="/reports" element={<Reports />} />
                    
                    {/* Configurações */}
                    <Route path="/settings" element={<Settings />} />
                    
                    {/* Rota 404 - redireciona para dashboard */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
