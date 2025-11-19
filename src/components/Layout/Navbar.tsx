import React, { useState } from 'react';
import { LogOut, Settings, User, Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  currentPage: string;
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onMenuClick }) => {
  const { signOut, user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const notifications = [
    { id: 1, message: 'انخفاض مستوى الشقوف', time: '5 دقائق', type: 'warning' },
    { id: 2, message: 'تم إضافة دفعة جديدة من البيض', time: '15 دقيقة', type: 'success' },
    { id: 3, message: 'موعد التغذية القادم', time: '30 دقيقة', type: 'info' },
  ];

  return (
    <div className="bg-white border-b border-slate-200/60 px-4 lg:px-8 py-4 lg:py-5 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Page Title */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-lg lg:text-2xl font-bold text-slate-900">{currentPage}</h1>
            <p className="hidden sm:block text-xs lg:text-sm text-slate-500 font-medium">إدارة مدجنة إنتاج البيض المتطورة</p>
          </div>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center space-x-2 lg:space-x-4 rtl:space-x-reverse">
          {/* Search */}
          <div className="hidden lg:flex items-center bg-slate-50 rounded-lg px-4 py-2 min-w-[300px]">
            <Search className="h-4 w-4 text-slate-400 ml-2" />
            <input
              type="text"
              placeholder="البحث في النظام..."
              className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400 w-full"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 lg:p-3 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all duration-200"
            >
              <Bell className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 lg:h-5 lg:w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {notifications.length}
              </span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute left-0 rtl:right-0 mt-2 w-72 lg:w-80 bg-white rounded-xl shadow-lg border border-slate-200/60 z-50 animate-fadeIn">
                <div className="p-4 border-b border-slate-200/60">
                  <h3 className="font-semibold text-slate-900">الإشعارات</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <p className="text-sm text-slate-700 font-medium">{notification.message}</p>
                      <p className="text-xs text-slate-500 mt-1">منذ {notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center border-t border-slate-200/60">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    عرض جميع الإشعارات
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* User Profile */}
          <div className="hidden md:flex items-center space-x-3 rtl:space-x-reverse bg-slate-50 rounded-lg px-3 lg:px-4 py-2">
            <div className="w-8 h-8 lg:w-9 lg:h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <User className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-slate-900">
                {user?.email?.split('@')[0] || 'مدير النظام'}
              </p>
              <p className="text-xs text-slate-500">متصل الآن</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-1 lg:space-x-2 rtl:space-x-reverse">
            <button className="p-2 lg:p-3 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all duration-200">
              <Settings className="h-4 w-4 lg:h-5 lg:w-5" />
            </button>
            
            <button
              onClick={handleSignOut}
              className="p-2 lg:p-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="تسجيل الخروج"
            >
              <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;