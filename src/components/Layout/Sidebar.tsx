import React from 'react';
import { 
  BarChart3, 
  Egg, 
  Bird, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  UserCheck,
  Settings,
  X
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, isOpen, onClose }) => {
  const { canRead, isAdmin } = usePermissions();
  
  const allMenuItems = [
    { id: 'dashboard', name: 'لوحة التحكم', icon: BarChart3, module: null },
    { id: 'chickens', name: 'إدارة الدجاج', icon: Bird, module: 'chickens' },
    { id: 'eggs', name: 'إدارة البيض', icon: Egg, module: 'eggs' },
    { id: 'cartons', name: 'الشقوفات', icon: Package, module: 'cartons' },
    { id: 'sales', name: 'المبيعات', icon: ShoppingCart, module: 'sales' },
    { id: 'expenses', name: 'المصروفات', icon: DollarSign, module: 'expenses' },
    { id: 'users', name: 'المستخدمين', icon: Users, module: 'users' },
    { id: 'clients', name: 'العملاء', icon: UserCheck, module: 'sales' },
    { id: 'settings', name: 'الإعدادات', icon: Settings, module: null },
  ];

  // Filter menu items based on permissions
  const menuItems = allMenuItems.filter(item => {
    if (item.id === 'users') return isAdmin;
    if (item.id === 'dashboard' || item.id === 'settings') return true;
    if (item.module) return canRead(item.module);
    return true;
  });

  const handlePageChange = (page: string) => {
    onPageChange(page);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 right-0 z-50
        w-72 bg-white border-r border-slate-200/60 flex flex-col shadow-sm
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
      {/* Logo Section */}
      <div className="p-4 lg:p-8 border-b border-slate-200/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Egg className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-slate-900">مدجنة البيض</h2>
              <p className="text-xs lg:text-sm text-slate-500 font-medium">نظام الإدارة المتكامل</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 p-3 lg:p-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handlePageChange(item.id)}
              className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-3 lg:px-4 lg:py-4 rounded-lg lg:rounded-xl text-right transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 shadow-sm border border-blue-200/50'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon 
                className={`h-4 w-4 lg:h-5 lg:w-5 transition-colors flex-shrink-0 ${
                  isActive 
                    ? 'text-blue-600' 
                    : 'text-slate-400 group-hover:text-slate-600'
                }`} 
              />
              <span className="font-medium text-xs lg:text-sm">{item.name}</span>
              {isActive && (
                <div className="mr-auto w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 lg:p-6 border-t border-slate-200/60">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-3 lg:p-4">
          <p className="text-xs text-slate-600 text-center font-medium">
            نظام إدارة المدجنة v2.0
          </p>
          <p className="text-xs text-slate-500 text-center mt-1">
            جميع الحقوق محفوظة © 2024
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default Sidebar;