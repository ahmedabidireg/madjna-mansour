import React, { useState, useEffect } from 'react';
import { 
  Bird, Egg, TrendingUp, TrendingDown, DollarSign, AlertTriangle, 
  Activity, Calendar, Bell, Package, Users, HeartPulse, Syringe,
  ArrowRight, Clock, CheckCircle, XCircle, Info, BarChart3, Sparkles
} from 'lucide-react';
import { databaseService } from '../services/database';
import { formatCurrencyTND } from '../lib/format';
import ChatBot from '../components/AI/ChatBot';

interface DashboardStats {
  totalChickens: number;
  aliveChickens: number;
  sickChickens: number;
  deadChickens: number;
  todayEggs: number;
  weeklyEggs: number;
  monthlyEggs: number;
  damageRate: number;
  totalDamagedEggs?: number;
  totalRevenue: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalExpenses: number;
  todayExpenses: number;
  weeklyExpenses: number;
  monthlyExpenses: number;
  profit: number;
  todayProfit: number;
  weeklyProfit: number;
  monthlyProfit: number;
  lowStockCartons?: any[];
  recentHealthEvents?: any[];
  upcomingVaccinations?: any[];
  recentSales?: any[];
  totalClients?: number;
  topBatches?: any[];
  worstBatches?: any[];
}

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const navigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  const [showChatBot, setShowChatBot] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalChickens: 0,
    aliveChickens: 0,
    sickChickens: 0,
    deadChickens: 0,
    todayEggs: 0,
    weeklyEggs: 0,
    monthlyEggs: 0,
    damageRate: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    totalExpenses: 0,
    todayExpenses: 0,
    weeklyExpenses: 0,
    monthlyExpenses: 0,
    profit: 0,
    todayProfit: 0,
    weeklyProfit: 0,
    monthlyProfit: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    // Refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardStats = await databaseService.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
    } finally {
      setLoading(false);
    }
  };

  const {
    totalChickens,
    aliveChickens,
    sickChickens,
    deadChickens,
    todayEggs,
    weeklyEggs,
    monthlyEggs,
    damageRate,
    totalDamagedEggs = 0,
    todayRevenue,
    weeklyRevenue,
    monthlyRevenue,
    todayExpenses,
    weeklyExpenses,
    monthlyExpenses,
    todayProfit,
    weeklyProfit,
    monthlyProfit,
    lowStockCartons = [],
    recentHealthEvents = [],
    upcomingVaccinations = [],
    recentSales = [],
    totalClients = 0,
    topBatches = [],
    worstBatches = []
  } = stats;

  // Calculate alerts
  const alerts = [];
  if (sickChickens > 0) {
    alerts.push({
      type: 'warning',
      icon: HeartPulse,
      message: `${sickChickens} دجاج يحتاج رعاية صحية`,
      action: () => navigate('chickens')
    });
  }
  if (lowStockCartons.length > 0) {
    alerts.push({
      type: 'warning',
      icon: Package,
      message: `${lowStockCartons.length} نوع كرتون مخزونه منخفض`,
      action: () => navigate('cartons')
    });
  }
  if (upcomingVaccinations.length > 0) {
    alerts.push({
      type: 'info',
      icon: Syringe,
      message: `${upcomingVaccinations.length} تلقيح قادم خلال 30 يوم`,
      action: () => navigate('chickens')
    });
  }
  if (damageRate > 10) {
    alerts.push({
      type: 'error',
      icon: AlertTriangle,
      message: `معدل التلف مرتفع: ${damageRate.toFixed(1)}%`,
      action: () => navigate('eggs')
    });
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-base font-medium">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="bg-slate-600 p-3 rounded-md">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">
                  لوحة التحكم الرئيسية
                </h1>
                <p className="text-gray-600 mt-1">نظرة شاملة على أداء المدجنة</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600">
              <Calendar className="h-4 w-4" />
              <span className="font-medium text-sm">{new Date().toLocaleDateString('ar-TN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
              <Bell className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-800">التنبيهات المهمة</h3>
            </div>
            <div className="space-y-3">
              {alerts.map((alert, index) => {
                const Icon = alert.icon;
                return (
                  <div
                    key={index}
                    onClick={alert.action}
                    className={`flex items-center justify-between p-4 rounded-md border cursor-pointer transition-all duration-200 hover:shadow-md ${
                      alert.type === 'error' ? 'bg-red-50 border-red-200' :
                      alert.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Icon className={`h-5 w-5 ${
                        alert.type === 'error' ? 'text-red-600' :
                        alert.type === 'warning' ? 'text-amber-600' :
                        'text-blue-600'
                      }`} />
                      <span className={`font-medium ${
                        alert.type === 'error' ? 'text-red-900' :
                        alert.type === 'warning' ? 'text-amber-900' :
                        'text-blue-900'
                      }`}>{alert.message}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Chickens */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-slate-100 p-3 rounded-md">
                <Bird className="h-6 w-6 text-slate-600" />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                {aliveChickens} حي
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">إجمالي الدجاج</p>
            <p className="text-3xl font-bold text-slate-800">{totalChickens.toLocaleString()}</p>
            <div className="mt-4 flex items-center space-x-4 rtl:space-x-reverse text-xs">
              <span className="text-amber-600">{sickChickens} مريض</span>
              <span className="text-red-600">{deadChickens} ميت</span>
            </div>
          </div>

          {/* Today's Production */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-100 p-3 rounded-md">
                <Egg className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                اليوم
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">إنتاج البيض</p>
            <p className="text-3xl font-bold text-slate-800">{todayEggs.toLocaleString()}</p>
            <div className="mt-4 flex items-center space-x-4 rtl:space-x-reverse text-xs">
              <span className="text-gray-600">الأسبوع: {weeklyEggs.toLocaleString()}</span>
              <span className="text-gray-600">الشهر: {monthlyEggs.toLocaleString()}</span>
            </div>
          </div>

          {/* Today's Profit */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-md ${todayProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                <DollarSign className={`h-6 w-6 ${todayProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                todayProfit >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
              }`}>
                اليوم
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">صافي الربح</p>
            <p className={`text-3xl font-bold ${todayProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrencyTND(todayProfit)}
            </p>
            <div className="mt-4 flex items-center space-x-4 rtl:space-x-reverse text-xs">
              <span className="text-gray-600">الأسبوع: {formatCurrencyTND(weeklyProfit)}</span>
              <span className="text-gray-600">الشهر: {formatCurrencyTND(monthlyProfit)}</span>
            </div>
          </div>

          {/* Damage Rate */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-md ${
                damageRate < 5 ? 'bg-emerald-100' : 
                damageRate < 10 ? 'bg-amber-100' : 
                'bg-red-100'
              }`}>
                <AlertTriangle className={`h-6 w-6 ${
                  damageRate < 5 ? 'text-emerald-600' : 
                  damageRate < 10 ? 'text-amber-600' : 
                  'text-red-600'
                }`} />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                damageRate < 5 ? 'text-emerald-600 bg-emerald-50' : 
                damageRate < 10 ? 'text-amber-600 bg-amber-50' : 
                'text-red-600 bg-red-50'
              }`}>
                {damageRate < 5 ? 'ممتاز' : damageRate < 10 ? 'جيد' : 'يحتاج تحسين'}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">معدل التلف</p>
            <p className={`text-3xl font-bold ${
              damageRate < 5 ? 'text-emerald-600' : 
              damageRate < 10 ? 'text-amber-600' : 
              'text-red-600'
            }`}>
              {damageRate.toFixed(1)}%
            </p>
            <p className="mt-4 text-xs text-gray-600">{totalDamagedEggs.toLocaleString()} بيضة تالفة</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Overview - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Financial Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <div className="flex items-center space-x-3 rtl:space-x-reverse text-white">
                  <BarChart3 className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">الملخص المالي</h3>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-emerald-50 p-4 rounded-md border border-emerald-200">
                    <p className="text-xs font-medium text-emerald-700 mb-1">المبيعات اليوم</p>
                    <p className="text-xl font-bold text-emerald-900">{formatCurrencyTND(todayRevenue)}</p>
                    <p className="text-xs text-emerald-600 mt-2">الأسبوع: {formatCurrencyTND(weeklyRevenue)}</p>
                    <p className="text-xs text-emerald-600">الشهر: {formatCurrencyTND(monthlyRevenue)}</p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-md border border-red-200">
                    <p className="text-xs font-medium text-red-700 mb-1">المصروفات اليوم</p>
                    <p className="text-xl font-bold text-red-900">{formatCurrencyTND(todayExpenses)}</p>
                    <p className="text-xs text-red-600 mt-2">الأسبوع: {formatCurrencyTND(weeklyExpenses)}</p>
                    <p className="text-xs text-red-600">الشهر: {formatCurrencyTND(monthlyExpenses)}</p>
                  </div>
                  
                  <div className={`p-4 rounded-md border ${
                    todayProfit >= 0 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <p className={`text-xs font-medium mb-1 ${
                      todayProfit >= 0 ? 'text-blue-700' : 'text-amber-700'
                    }`}>الربح الصافي</p>
                    <p className={`text-xl font-bold ${
                      todayProfit >= 0 ? 'text-blue-900' : 'text-amber-900'
                    }`}>
                      {formatCurrencyTND(todayProfit)}
                    </p>
                    <p className={`text-xs mt-2 ${
                      todayProfit >= 0 ? 'text-blue-600' : 'text-amber-600'
                    }`}>الأسبوع: {formatCurrencyTND(weeklyProfit)}</p>
                    <p className={`text-xs ${
                      todayProfit >= 0 ? 'text-blue-600' : 'text-amber-600'
                    }`}>الشهر: {formatCurrencyTND(monthlyProfit)}</p>
                  </div>
                </div>

                {/* Recent Sales */}
                {recentSales.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">آخر المبيعات</h4>
                    <div className="space-y-2">
                      {recentSales.map((sale: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{sale.client_name || 'عميل'}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(sale.sale_date).toLocaleDateString('ar-TN')}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-emerald-600">
                            {formatCurrencyTND(sale.total_amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Batch Performance */}
            {(topBatches.length > 0 || worstBatches.length > 0) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">أداء الدفعات</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-emerald-700 mb-2">أفضل الدفعات</h4>
                    <div className="space-y-2">
                      {topBatches.slice(0, 3).map((batch: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-emerald-50 rounded-md">
                          <span className="text-sm font-medium text-emerald-900">{batch.batch_number}</span>
                          <span className="text-xs text-emerald-700">{batch.count} دجاجة</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-amber-700 mb-2">أصغر الدفعات</h4>
                    <div className="space-y-2">
                      {worstBatches.slice(0, 3).map((batch: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-amber-50 rounded-md">
                          <span className="text-sm font-medium text-amber-900">{batch.batch_number}</span>
                          <span className="text-xs text-amber-700">{batch.count} دجاجة</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Vaccinations */}
            {upcomingVaccinations.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
                  <Syringe className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-800">التلقيحات القادمة</h3>
                </div>
                <div className="space-y-3">
                  {upcomingVaccinations.slice(0, 5).map((vaccination: any, index: number) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-md border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">{vaccination.vaccine_name}</p>
                      <p className="text-xs text-blue-700 mt-1">
                        {vaccination.next_vaccination_date 
                          ? new Date(vaccination.next_vaccination_date).toLocaleDateString('ar-TN')
                          : 'غير محدد'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">دفعة: {vaccination.chicken_batch_id}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Health Events */}
            {recentHealthEvents.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
                  <HeartPulse className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-slate-800">الأحداث الصحية الأخيرة</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    آخر 5
                  </span>
                </div>
                <div className="space-y-3">
                  {recentHealthEvents.map((event: any, index: number) => (
                    <div key={index} className={`p-3 rounded-md border ${
                      event.event_type === 'death' ? 'bg-red-50 border-red-200' : 
                      event.event_type === 'recovery' ? 'bg-emerald-50 border-emerald-200' : 
                      'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          event.event_type === 'death' 
                            ? 'bg-red-100 text-red-800' : 
                          event.event_type === 'recovery'
                            ? 'bg-emerald-100 text-emerald-800' :
                            'bg-amber-100 text-amber-800'
                        }`}>
                          {event.event_type === 'death' ? 'وفاة' : 
                           event.event_type === 'recovery' ? 'تعافي' : 
                           'مرض'}
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(event.date).toLocaleDateString('ar-TN')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mt-2 line-clamp-2">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">إحصائيات سريعة</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">إجمالي العملاء</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{totalClients}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Package className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">كرتون منخفض</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{lowStockCartons.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Egg className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">متوسط يومي (7 أيام)</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {Math.round(weeklyEggs / 7).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant Button - Floating */}
        {!showChatBot && (
          <button
            onClick={() => setShowChatBot(true)}
            className="fixed bottom-6 left-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 rtl:space-x-reverse z-40 group"
          >
            <div className="bg-white/20 p-2 rounded-full">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-medium">المساعد الذكي</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
          </button>
        )}

        {/* ChatBot Component */}
        {showChatBot && (
          <ChatBot 
            farmStats={stats} 
            onClose={() => setShowChatBot(false)} 
          />
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">إجراءات سريعة</h3>
            <button
              onClick={() => setShowChatBot(true)}
              className="flex items-center space-x-2 rtl:space-x-reverse text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">استشر المساعد الذكي</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <button 
              onClick={() => navigate('chickens')}
              className="p-4 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors duration-200 text-center"
            >
              <Bird className="h-5 w-5 text-slate-600 mx-auto mb-2" />
              <p className="font-medium text-slate-800 text-sm">إدارة الدجاج</p>
            </button>
            <button 
              onClick={() => navigate('eggs')}
              className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors duration-200 text-center"
            >
              <Egg className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
              <p className="font-medium text-emerald-800 text-sm">إنتاج البيض</p>
            </button>
            <button 
              onClick={() => navigate('sales')}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors duration-200 text-center"
            >
              <DollarSign className="h-5 w-5 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-blue-800 text-sm">المبيعات</p>
            </button>
            <button 
              onClick={() => navigate('expenses')}
              className="p-4 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition-colors duration-200 text-center"
            >
              <TrendingDown className="h-5 w-5 text-amber-600 mx-auto mb-2" />
              <p className="font-medium text-amber-800 text-sm">المصروفات</p>
            </button>
            <button 
              onClick={() => navigate('clients')}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-md border border-purple-200 transition-colors duration-200 text-center"
            >
              <Users className="h-5 w-5 text-purple-600 mx-auto mb-2" />
              <p className="font-medium text-purple-800 text-sm">العملاء</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
