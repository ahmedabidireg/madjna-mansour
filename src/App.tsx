import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Auth/Login';
import Sidebar from './components/Layout/Sidebar';
import Navbar from './components/Layout/Navbar';
import Dashboard from './pages/Dashboard';
import ChickenManagement from './pages/ChickenManagement';
import EggManagement from './pages/EggManagement';
import CartonManagement from './pages/CartonManagement';
import SalesManagement from './pages/SalesManagement';
import ExpenseManagement from './pages/ExpenseManagement';
import UserManagement from './pages/userManagement';
import ClientManagement from './pages/ClientManagement';
import Settings from './pages/Settings';

const pageNames: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  chickens: 'إدارة الدجاج',
  eggs: 'إدارة البيض',
  cartons: 'إدارة الشقوفات',
  sales: 'إدارة المبيعات',
  expenses: 'إدارة المصروفات',
  users: 'إدارة المستخدمين',
  clients: 'إدارة العملاء',
  settings: 'الإعدادات',
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'chickens':
        return <ChickenManagement />;
      case 'eggs':
        return <EggManagement />;
      case 'cartons':
        return <CartonManagement />;
      case 'sales':
        return <SalesManagement />;
      case 'expenses':
        return <ExpenseManagement />;
      case 'users':
        return <UserManagement/>;
      case 'clients':
        return <ClientManagement/>;
      case 'settings':
        return <Settings/>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" dir="rtl">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        <Navbar 
          currentPage={pageNames[currentPage]} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-3 sm:p-4 lg:p-6">
          <div className="animate-fadeIn">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;