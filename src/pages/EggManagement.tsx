import React, { useState, useEffect,useMemo  } from 'react';
import { Plus, Edit, Trash2, Egg, X, Calendar, Clock, AlertTriangle, Package, TrendingUp } from 'lucide-react';
import { EggProduction } from '../types';
import { databaseService } from '../services/database';
import { usePermissions } from '../hooks/usePermissions';
import Pagination from '../components/common/Pagination';

const EggManagement: React.FC = () => {
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const [eggProductions, setEggProductions] = useState<EggProduction[]>([]);
  const [chickens, setChickens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState<EggProduction | null>(null);
  
  // Form data with input type selection
  const [formData, setFormData] = useState<Partial<EggProduction>>({
    date: new Date().toISOString().split('T')[0],
    batch_number: '',
    total_eggs: 0,
    damaged_eggs: 0,
    good_eggs: 0,
    collection_time: new Date().toTimeString().slice(0, 5),
    notes: ''
  });

  // New state for input type selection
  const [inputType, setInputType] = useState<'eggs' | 'trays'>('eggs');
  const [traysCount, setTraysCount] = useState(0);
  const [eggsPerTray, setEggsPerTray] = useState(30); // Default 30 eggs per tray

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eggData, chickenData] = await Promise.all([
        databaseService.getEggProductions(),
        databaseService.getChickens()
      ]);
      setEggProductions(eggData);
      setChickens(chickenData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total eggs based on input type
  const calculateTotalEggs = () => {
    if (inputType === 'trays') {
      return traysCount * eggsPerTray;
    }
    return formData.total_eggs || 0;
  };

  // Update good eggs when total or damaged changes
  useEffect(() => {
    const total = calculateTotalEggs();
    const damaged = formData.damaged_eggs || 0;
    const good = Math.max(0, total - damaged);
    
    setFormData(prev => ({
      ...prev,
      total_eggs: total,
      good_eggs: good
    }));
  }, [inputType, traysCount, eggsPerTray, formData.damaged_eggs, formData.total_eggs]);

  const handleAddProduction = async () => {
    try {
      const productionData = {
        ...formData,
        total_eggs: calculateTotalEggs(),
        good_eggs: calculateTotalEggs() - (formData.damaged_eggs || 0)
      };

      await databaseService.addEggProduction(productionData as Omit<EggProduction, 'id'>);
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('خطأ في إضافة الإنتاج:', error);
    }
  };

  const handleEditProduction = async () => {
    if (!selectedProduction) return;
    try {
      const productionData = {
        ...formData,
        total_eggs: calculateTotalEggs(),
        good_eggs: calculateTotalEggs() - (formData.damaged_eggs || 0)
      };
      await databaseService.updateEggProduction(selectedProduction.id, productionData);
      setShowEditModal(false);
      setSelectedProduction(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('خطأ في تعديل الإنتاج:', error);
    }
  };

  const handleDeleteProduction = async () => {
    if (!selectedProduction) return;
    try {
      await databaseService.deleteEggProduction(selectedProduction.id);
      setShowDeleteModal(false);
      setSelectedProduction(null);
      loadData();
    } catch (error: any) {
      console.error('خطأ في حذف الإنتاج:', error);
      alert(error.message || 'فشل حذف السجل. يرجى المحاولة مرة أخرى.');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      batch_number: '',
      total_eggs: 0,
      damaged_eggs: 0,
      good_eggs: 0,
      collection_time: new Date().toTimeString().slice(0, 5),
      notes: ''
    });
    setInputType('eggs');
    setTraysCount(0);
    setEggsPerTray(30);
  };

  const openEditModal = (production: EggProduction) => {
    setSelectedProduction(production);
    setFormData({
      date: production.date,
      batch_number: production.batch_number,
      total_eggs: production.total_eggs,
      damaged_eggs: production.damaged_eggs,
      good_eggs: production.good_eggs,
      collection_time: production.collection_time,
      notes: production.notes || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (production: EggProduction) => {
    setSelectedProduction(production);
    setShowDeleteModal(true);
  };

  // Calculate statistics
  const totalEggs = eggProductions.reduce((sum, prod) => sum + prod.total_eggs, 0);
  const totalGoodEggs = eggProductions.reduce((sum, prod) => sum + prod.good_eggs, 0);
  const totalDamagedEggs = eggProductions.reduce((sum, prod) => sum + prod.damaged_eggs, 0);
  const damageRate = totalEggs > 0 ? (totalDamagedEggs / totalEggs) * 100 : 0;
  
  // Current stock (الإنتاج المتواجد)
  const totalCurrentStock = chickens.reduce((sum, c) => sum + (c.current_stock || 0), 0);
  const highestStockBatch = chickens.reduce<(typeof chickens)[0] | null>((top, batch) => {
    const topStock = top?.current_stock || 0;
    const currentStock = batch?.current_stock || 0;
    if (!top || currentStock > topStock) {
      return batch;
    }
    return top;
  }, null);
  const availableBatches = chickens.filter((c) => (c.current_stock || 0) > 0);

  const sortedProductions = useMemo(() => {
    return [...eggProductions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA === dateB) {
        return (b.id || '').localeCompare(a.id || '');
      }
      return dateB - dateA;
    });
  }, [eggProductions]);

  // Pagination
  const totalPages = Math.ceil(eggProductions.length / itemsPerPage);
  const paginatedProductions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedProductions.slice(startIndex, endIndex);
  }, [sortedProductions, currentPage, itemsPerPage]);

  // Today's production
  const today = new Date().toISOString().split('T')[0];
  const todayProduction = eggProductions.find(p => p.date === today);
  const todayEggs = todayProduction?.total_eggs || 0;

  // Weekly production (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyEggs = eggProductions
    .filter(p => new Date(p.date) >= weekAgo)
    .reduce((sum, p) => sum + p.total_eggs, 0);

  // Check read permission
  if (!canRead('eggs')) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد صلاحية</h3>
          <p className="text-gray-600">ليس لديك صلاحية لعرض إنتاج البيض</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-base font-medium">جاري تحميل بيانات الإنتاج...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="bg-slate-600 p-3 rounded-md">
                <Egg className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">
                  إدارة إنتاج البيض
                </h1>
                <p className="text-gray-600 mt-1">تسجيل ومتابعة الإنتاج اليومي للبيض</p>
              </div>
            </div>
            {canCreate('eggs') && (
              <button 
                className="bg-slate-600 hover:bg-slate-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 rtl:space-x-reverse transition-colors duration-200 text-sm sm:text-base"
                onClick={() => setShowAddModal(true)}
                title="تسجيل إنتاج جديد"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">تسجيل إنتاج جديد</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">إنتاج اليوم</p>
                <p className="text-2xl font-semibold text-slate-800">{todayEggs}</p>
                <p className="text-xs text-blue-600 mt-1 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  بيضة اليوم
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-md">
                <Egg className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">الإنتاج الأسبوعي</p>
                <p className="text-2xl font-semibold text-slate-800">{weeklyEggs}</p>
                <p className="text-xs text-emerald-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  آخر 7 أيام
                </p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-md">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">البيض الجيد</p>
                <p className="text-2xl font-semibold text-slate-800">{totalGoodEggs}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  إجمالي صالح
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-md">
                <Egg className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">معدل التلف</p>
                <p className={`text-2xl font-semibold ${
                  damageRate < 5 ? 'text-emerald-600' : damageRate < 10 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {damageRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-600 mt-1 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {totalDamagedEggs} تالف
                </p>
              </div>
              <div className={`p-3 rounded-md ${
                damageRate < 5 ? 'bg-emerald-100' : damageRate < 10 ? 'bg-amber-100' : 'bg-red-100'
              }`}>
                <AlertTriangle className={`h-6 w-6 ${
                  damageRate < 5 ? 'text-emerald-600' : damageRate < 10 ? 'text-amber-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">الإنتاج المتواجد</p>
                <p className="text-2xl font-semibold text-purple-600">{totalCurrentStock}</p>
                <p className="text-xs text-purple-600 mt-1 flex items-center">
                  <Package className="h-3 w-3 mr-1" />
                  متوفر للبيع
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-md">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">أعلى دفعة جاهزة</p>
                <p className="text-xl font-semibold text-slate-800">
                  {highestStockBatch?.batch_number || 'لا توجد دفعة'}
                </p>
                <p className="text-xs text-slate-600 mt-1 flex items-center">
                  <Package className="h-3 w-3 mr-1" />
                  {highestStockBatch ? `${highestStockBatch.current_stock || 0} بيضة متوفرة` : 'بدون بيانات'}
                </p>
              </div>
              <div className="bg-slate-100 p-3 rounded-md">
                <Package className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Batches Stock Cards */}
        {availableBatches.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Package className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">المخزون حسب الدفعات</h3>
              </div>
              <span className="text-sm text-gray-500">إجمالي {availableBatches.length} دفعة</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {availableBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-slate-300 hover:shadow transition-shadow duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500">رقم الدفعة</p>
                      <p className="text-lg font-semibold text-slate-800">{batch.batch_number}</p>
                    </div>
                    <div className="bg-slate-100 rounded-full px-3 py-1 text-xs font-medium text-slate-600">
                      {batch.breed}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">المتوفر</p>
                      <p className="text-2xl font-semibold text-emerald-600">
                        {batch.current_stock?.toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">العمر (أسابيع)</p>
                      <p className="text-sm font-medium text-gray-700">{batch.age_weeks ?? '-'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-600 p-6">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Egg className="h-5 w-5 text-white" />
              <h3 className="text-lg font-semibold text-white">سجل إنتاج البيض</h3>
            </div>
          </div>
          
          {eggProductions.length === 0 ? (
            <div className="p-12 text-center">
              <Egg className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد إنتاج مسجل</h3>
              <p className="text-gray-500 mb-6">ابدأ بتسجيل أول إنتاج يومي للبيض</p>
              <button 
                className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg flex items-center space-x-3 rtl:space-x-reverse mx-auto transition-colors duration-200"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4" />
                <span>تسجيل إنتاج جديد</span>
              </button>
            </div>
          ) : (
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      رقم الدفعة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      وقت الجمع
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      إجمالي البيض
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      البيض الجيد
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      البيض التالف
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      معدل التلف
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ملاحظات
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedProductions.map((production) => {
                    const productionDamageRate = production.total_eggs > 0 ? (production.damaged_eggs / production.total_eggs) * 100 : 0;
                    
                    return (
                      <tr key={production.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-gray-100 p-2 rounded-md mr-3">
                              <Calendar className="h-4 w-4 text-gray-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(production.date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {production.batch_number}
                            </span>
                            {(() => {
                              const batch = chickens.find(c => c.batch_number === production.batch_number);
                              const stock = batch?.current_stock || 0;
                              return stock > 0 ? (
                                <span className="text-xs text-green-600 mr-2" title="المخزون المتوفر">
                                  ({stock} متوفر)
                                </span>
                              ) : null;
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{production.collection_time}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {production.total_eggs}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {production.good_eggs}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            production.damaged_eggs > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {production.damaged_eggs}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            productionDamageRate > 10 ? 'bg-red-100 text-red-800' : 
                            productionDamageRate > 5 ? 'bg-amber-100 text-amber-800' : 
                            'bg-green-100 text-green-800'
                          }`}>
                            {productionDamageRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">
                          {production.notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            {canUpdate('eggs') && (
                              <button 
                                className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50 transition-colors duration-200"
                                onClick={() => openEditModal(production)}
                                title="تعديل الإنتاج"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete('eggs') && (
                              <button 
                                className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-50 transition-colors duration-200"
                                onClick={() => openDeleteModal(production)}
                                title="حذف الإنتاج"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            {!canUpdate('eggs') && !canDelete('eggs') && (
                              <span className="text-gray-400 text-xs">لا توجد صلاحيات</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Cards View */}
          <div className="lg:hidden space-y-4 mt-4">
            {paginatedProductions.map((production) => {
              const productionDamageRate = production.total_eggs > 0 ? (production.damaged_eggs / production.total_eggs) * 100 : 0;
              const batch = chickens.find(c => c.batch_number === production.batch_number);
              const stock = batch?.current_stock || 0;
              
              return (
                <div key={production.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse flex-1">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Egg className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800 truncate">
                          {new Date(production.date).toLocaleDateString('fr-FR')}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {production.batch_number} {stock > 0 && `(${stock} متوفر)`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {canUpdate('eggs') && (
                        <button
                          onClick={() => openEditModal(production)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete('eggs') && (
                        <button
                          onClick={() => openDeleteModal(production)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">إجمالي البيض:</span>
                      <span className="text-sm font-semibold text-gray-900">{production.total_eggs}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">البيض الجيد:</span>
                      <span className="text-sm font-semibold text-green-600">{production.good_eggs}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">البيض التالف:</span>
                      <span className="text-sm font-semibold text-red-600">{production.damaged_eggs}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-600">معدل التلف:</span>
                      <span className={`text-xs font-semibold ${
                        productionDamageRate < 5 ? 'text-emerald-600' : productionDamageRate < 10 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {productionDamageRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {eggProductions.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={eggProductions.length}
            />
          )}
        </div>

        {/* Add Production Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl shadow-lg">
              <div className="bg-slate-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Egg className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">تسجيل إنتاج بيض جديد</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="p-1 hover:bg-slate-500 rounded-md transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Input Type Selection */}
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">طريقة الإدخال</h4>
                  <div className="flex space-x-4 rtl:space-x-reverse">
                    <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                      <input
                        type="radio"
                        name="inputType"
                        value="eggs"
                        checked={inputType === 'eggs'}
                        onChange={(e) => setInputType(e.target.value as 'eggs' | 'trays')}
                        className="text-slate-600 focus:ring-slate-500"
                      />
                      <span className="text-gray-700 font-medium">عدد البيض مباشرة</span>
                    </label>
                    <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                      <input
                        type="radio"
                        name="inputType"
                        value="trays"
                        checked={inputType === 'trays'}
                        onChange={(e) => setInputType(e.target.value as 'eggs' | 'trays')}
                        className="text-slate-600 focus:ring-slate-500"
                      />
                      <span className="text-gray-700 font-medium">عدد البلاطوات (Plateaux)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الدفعة *</label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                    required
                  >
                    <option value="">اختر الدفعة</option>
                    {chickens.filter(c => c.status === 'alive').map((chicken) => (
                      <option key={chicken.id} value={chicken.batch_number}>
                        {chicken.batch_number} - {chicken.breed}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ</label>
                    <input
                      type="date"
                      className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">وقت الجمع</label>
                    <input
                      type="time"
                      className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                      value={formData.collection_time}
                      onChange={(e) => setFormData({...formData, collection_time: e.target.value})}
                    />
                  </div>
                </div>

                {/* Conditional Input Based on Type */}
                {inputType === 'eggs' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">إجمالي البيض</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                      value={formData.total_eggs}
                      onChange={(e) => setFormData({...formData, total_eggs: parseInt(e.target.value) || 0})}
                      min="0"
                      placeholder="أدخل العدد الإجمالي للبيض"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">عدد البلاطوات</label>
                      <input
                        type="number"
                        className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                        value={traysCount}
                        onChange={(e) => setTraysCount(parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder="عدد البلاطوات"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">البيض لكل بلاطو</label>
                      <select
                        className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                        value={eggsPerTray}
                        onChange={(e) => setEggsPerTray(parseInt(e.target.value))}
                      >
                        <option value={15}>15 بيضة</option>
                        <option value={20}>20 بيضة</option>
                        <option value={24}>24 بيضة</option>
                        <option value={30}>30 بيضة</option>
                        <option value={36}>36 بيضة</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Total Calculation Display */}
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">إجمالي البيض المحسوب:</span>
                    <span className="text-xl font-semibold text-slate-800">{calculateTotalEggs()} بيضة</span>
                  </div>
                  {inputType === 'trays' && (
                    <p className="text-sm text-gray-600 mt-1">
                      {traysCount} بلاطو × {eggsPerTray} بيضة = {calculateTotalEggs()} بيضة
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">البيض التالف</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.damaged_eggs}
                    onChange={(e) => setFormData({...formData, damaged_eggs: parseInt(e.target.value) || 0})}
                    min="0"
                    max={calculateTotalEggs()}
                    placeholder="عدد البيض التالف"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    البيض الجيد: {Math.max(0, calculateTotalEggs() - (formData.damaged_eggs || 0))} بيضة
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                  <textarea
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="أي ملاحظات حول الإنتاج..."
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  إلغاء
                </button>
                <button
                  className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  onClick={handleAddProduction}
                  disabled={calculateTotalEggs() === 0 || !formData.batch_number}
                >
                  تسجيل الإنتاج
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Production Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl shadow-lg">
              <div className="bg-slate-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Edit className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">تعديل الإنتاج</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="p-1 hover:bg-slate-500 rounded-md transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الدفعة *</label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                    required
                  >
                    <option value="">اختر الدفعة</option>
                    {chickens.filter(c => c.status === 'alive').map((chicken) => (
                      <option key={chicken.id} value={chicken.batch_number}>
                        {chicken.batch_number} - {chicken.breed}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ</label>
                    <input
                      type="date"
                      className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">وقت الجمع</label>
                    <input
                      type="time"
                      className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                      value={formData.collection_time}
                      onChange={(e) => setFormData({...formData, collection_time: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">إجمالي البيض</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                      value={formData.total_eggs}
                      onChange={(e) => setFormData({...formData, total_eggs: parseInt(e.target.value) || 0})}
                      min="0"
                    />
                  </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">البيض التالف</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.damaged_eggs}
                    onChange={(e) => setFormData({...formData, damaged_eggs: parseInt(e.target.value) || 0})}
                    min="0"
                    max={formData.total_eggs}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                  <textarea
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                >
                  إلغاء
                </button>
                <button
                  className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors duration-200"
                  onClick={handleEditProduction}
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
              <div className="bg-red-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <AlertTriangle className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">حذف الإنتاج</h3>
                  </div>
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="p-1 hover:bg-red-500 rounded-md transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 text-center mb-2">هل أنت متأكد من الحذف؟</h4>
                <p className="text-gray-600 text-center">
                  تاريخ الإنتاج: <span className="font-semibold">{selectedProduction && new Date(selectedProduction.date).toLocaleDateString('fr-FR')}</span>
                  <br />
                  سيتم حذف جميع البيانات المرتبطة بهذا الإنتاج بشكل نهائي.
                </p>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-center space-x-3 rtl:space-x-reverse">
                <button
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium"
                  onClick={() => setShowDeleteModal(false)}
                >
                  إلغاء
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 font-medium"
                  onClick={handleDeleteProduction}
                >
                  نعم، احذف الإنتاج
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EggManagement;