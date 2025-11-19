import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Package, X, AlertTriangle, TrendingUp, Box } from 'lucide-react';
import { Carton } from '../types';
import { databaseService } from '../services/database';
import { formatCurrencyTND } from '../lib/format';
import { usePermissions } from '../hooks/usePermissions';
import Pagination from '../components/common/Pagination';

const CartonManagement: React.FC = () => {
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const [cartons, setCartons] = useState<Carton[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCarton, setSelectedCarton] = useState<Carton | null>(null);
  const [formData, setFormData] = useState<Partial<Carton>>({
    type: '',
    capacity: 30,
    available_quantity: 0,
    purchase_price: 0,
    supplier: '',
    purchase_date: new Date().toISOString().split('T')[0]
  });
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawCarton, setWithdrawCarton] = useState<Carton | null>(null);
  const [withdrawType, setWithdrawType] = useState<string | null>(null);
  const [withdrawData, setWithdrawData] = useState<{ quantity: number; date: string; notes?: string }>({
    quantity: 1,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Predefined carton types
  const cartonTypes = [
    { value: '15', label: 'شقف 15', capacity: 30 },
    { value: '15.5', label: 'شقف 15.5', capacity: 30 },
    { value: '16', label: 'شقف 16', capacity: 30 },
    { value: '17', label: 'شقف 17', capacity: 30 },
    { value: 'مصري', label: 'شقف مصري', capacity: 30 },
    { value: 'جزائري', label: 'شقف جزائري', capacity: 30 },
    { value: 'custom', label: 'نوع مخصص', capacity: 30 }
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Force capacity to 30 for all types
    setFormData(prev => ({ ...prev, capacity: 30 }));
  }, [formData.type]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await databaseService.getCartons();
      setCartons(data);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCarton = async () => {
    try {
      await databaseService.addCarton(formData as Omit<Carton, 'id'>);
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('خطأ في إضافة الشقف:', error);
    }
  };

  const handleEditCarton = async () => {
    if (!selectedCarton) return;
    try {
      await databaseService.updateCarton(selectedCarton.id, formData);
      setShowEditModal(false);
      setSelectedCarton(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('خطأ في تعديل الشقف:', error);
    }
  };

  const handleDeleteCarton = async () => {
    if (!selectedCarton) return;
    try {
      await databaseService.deleteCarton(selectedCarton.id);
      setShowDeleteModal(false);
      setSelectedCarton(null);
      loadData();
    } catch (error) {
      console.error('خطأ في حذف الشقف:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: '',
      capacity: 30,
      available_quantity: 0,
      purchase_price: 0,
      supplier: '',
      purchase_date: new Date().toISOString().split('T')[0]
    });
  };

  const openEditModal = (carton: Carton) => {
    setSelectedCarton(carton);
    setFormData({
      type: carton.type,
      capacity: 30,
      available_quantity: carton.available_quantity,
      purchase_price: carton.purchase_price,
      supplier: carton.supplier,
      purchase_date: carton.purchase_date
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (carton: Carton) => {
    setSelectedCarton(carton);
    setShowDeleteModal(true);
  };

  const getCartonTypeLabel = (type: string) => {
    const cartonType = cartonTypes.find(ct => ct.value === type);
    return cartonType ? cartonType.label : `شقف ${type}`;
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'نفد', color: 'bg-red-100 text-red-800' };
    if (quantity <= 10) return { status: 'منخفض', color: 'bg-amber-100 text-amber-800' };
    if (quantity <= 50) return { status: 'متوسط', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'جيد', color: 'bg-emerald-100 text-emerald-800' };
  };

  // Calculate statistics
  const totalCartons = cartons.reduce((sum, carton) => sum + carton.available_quantity, 0);
  const totalValue = cartons.reduce((sum, carton) => sum + (carton.available_quantity * carton.purchase_price), 0);
  const lowStockCartons = cartons.filter(carton => carton.available_quantity <= 10).length;
  const outOfStockCartons = cartons.filter(carton => carton.available_quantity === 0).length;

  const sortedCartons = useMemo(() => {
    return [...cartons].sort((a, b) => {
      const dateA = a.purchase_date ? new Date(a.purchase_date).getTime() : 0;
      const dateB = b.purchase_date ? new Date(b.purchase_date).getTime() : 0;
      if (dateA === dateB) {
        return (b.id || '').localeCompare(a.id || '');
      }
      return dateB - dateA;
    });
  }, [cartons]);

  // Pagination
  const totalPages = Math.ceil(cartons.length / itemsPerPage);
  const paginatedCartons = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedCartons.slice(startIndex, endIndex);
  }, [sortedCartons, currentPage, itemsPerPage]);

  // Most popular carton types
  const cartonsByType = cartons.reduce((acc, carton) => {
    acc[carton.type] = (acc[carton.type] || 0) + carton.available_quantity;
    return acc;
  }, {} as Record<string, number>);

  // Check read permission
  if (!canRead('cartons')) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد صلاحية</h3>
          <p className="text-gray-600">ليس لديك صلاحية لعرض الشقوفات</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-base font-medium">جاري تحميل البيانات...</p>
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
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">
                  إدارة الشقوف
                </h1>
                <p className="text-gray-600 mt-1">تتبع مخزون الشقوف وإدارة الأنواع</p>
              </div>
            </div>
            <button 
              className="bg-slate-600 hover:bg-slate-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 rtl:space-x-reverse transition-colors duration-200 text-sm sm:text-base"
              onClick={() => setShowAddModal(true)}
              title="إضافة شقف جديد"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">إضافة شقف جديد</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">إجمالي الشقوف</p>
                <p className="text-2xl font-semibold text-slate-800">{totalCartons.toLocaleString()}</p>
                <p className="text-xs text-slate-600 mt-1 flex items-center">
                  <Package className="h-3 w-3 mr-1" />
                  شقف متاح
                </p>
              </div>
              <div className="bg-slate-100 p-3 rounded-md">
                <Package className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">قيمة المخزون</p>
                <p className="text-2xl font-semibold text-slate-800">{totalValue.toLocaleString()}</p>
                <p className="text-xs text-emerald-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  دينار تونسي
                </p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-md">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">مخزون منخفض</p>
                <p className="text-2xl font-semibold text-slate-800">{lowStockCartons}</p>
                <p className="text-xs text-amber-600 mt-1 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  نوع شقف
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-md">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">نفد من المخزون</p>
                <p className="text-2xl font-semibold text-slate-800">{outOfStockCartons}</p>
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <Box className="h-3 w-3 mr-1" />
                  نوع شقف
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-md">
                <Box className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-600 p-6">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Package className="h-5 w-5 text-white" />
              <h3 className="text-lg font-semibold text-white">مخزون الشقوف</h3>
            </div>
          </div>
          
          {cartons.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد شقوف مسجلة</h3>
              <p className="text-gray-500 mb-6">ابدأ بإضافة أول نوع من الشقوف</p>
              <button 
                className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg flex items-center space-x-3 rtl:space-x-reverse mx-auto transition-colors duration-200"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4" />
                <span>إضافة شقف جديد</span>
              </button>
            </div>
          ) : (
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      نوع الشقف
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      السعة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الكمية المتاحة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      حالة المخزون
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      سعر الشراء
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المورد
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الشراء
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCartons.map((carton, index) => {
                    const stockStatus = getStockStatus(carton.available_quantity);
                    
                    return (
                      <tr key={carton.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-slate-100 p-2 rounded-md mr-3">
                              <Package className="h-4 w-4 text-slate-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {getCartonTypeLabel(carton.type)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{carton.capacity} بيضة</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-semibold text-gray-900">{carton.available_quantity}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                            {stockStatus.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{formatCurrencyTND(carton.purchase_price)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {carton.supplier || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {carton.purchase_date ? new Date(carton.purchase_date).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            {canUpdate('cartons') && (
                              <button 
                                className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50 transition-colors duration-200"
                                onClick={() => openEditModal(carton)}
                                title="تعديل الشقف"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete('cartons') && (
                              <button 
                                className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-50 transition-colors duration-200"
                                onClick={() => openDeleteModal(carton)}
                                title="حذف الشقف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            {!canUpdate('cartons') && !canDelete('cartons') && (
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
            {paginatedCartons.map((carton) => {
              const stockStatus = carton.available_quantity < 10 ? 'low' : carton.available_quantity < 50 ? 'medium' : 'high';
              
              return (
                <div key={carton.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse flex-1">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800 truncate">
                          {carton.type}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">السعة: {carton.capacity}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {canUpdate('cartons') && (
                        <button
                          onClick={() => openEditModal(carton)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete('cartons') && (
                        <button
                          onClick={() => openDeleteModal(carton)}
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
                      <span className="text-xs text-gray-600">الكمية المتاحة:</span>
                      <span className={`text-sm font-semibold ${
                        stockStatus === 'low' ? 'text-red-600' : stockStatus === 'medium' ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {carton.available_quantity}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">سعر الشراء:</span>
                      <span className="text-sm text-gray-900">{formatCurrencyTND(carton.purchase_price)}</span>
                    </div>
                    
                    {carton.supplier && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">المورد:</span>
                        <span className="text-sm text-gray-900">{carton.supplier}</span>
                      </div>
                    )}
                    
                    {carton.purchase_date && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-600">تاريخ الشراء:</span>
                        <span className="text-sm text-gray-900">
                          {new Date(carton.purchase_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {cartons.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={cartons.length}
            />
          )}
        </div>

        {/* Carton Types Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-600 p-6">
            <h3 className="text-lg font-semibold text-white">توزيع الشقوف حسب النوع</h3>
            <p className="text-slate-200 mt-1">الكميات المتاحة لكل نوع من الشقوف</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(cartonsByType).map(([type, quantity]) => (
                <div key={type} className="bg-gray-50 rounded-md p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <div className="bg-slate-600 p-2 rounded-md">
                        <Package className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">{getCartonTypeLabel(type)}</span>
                    </div>
                    <span className="text-lg font-semibold text-slate-800">{quantity}</span>
                  </div>
                  <div className="mt-3 text-right">
                    <button
                      className="px-3 py-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors duration-200"
                      onClick={() => {
                        setWithdrawType(type);
                        setWithdrawCarton(null);
                        setWithdrawData({ quantity: 1, date: new Date().toISOString().split('T')[0], notes: '' });
                        setShowWithdrawModal(true);
                      }}
                      title="سحب من هذا النوع"
                    >
                      سحب
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add Carton Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
              <div className="bg-slate-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Package className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">إضافة شقف جديد</h3>
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
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع الشقف</label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="">اختر نوع الشقف</option>
                    {cartonTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">السعة (عدد البيض)</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.capacity}
                    min="30"
                    readOnly
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الكمية المتاحة</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.available_quantity}
                    min="0"
                    onChange={(e) => setFormData({...formData, available_quantity: parseInt(e.target.value) || 0})}
                    placeholder="الكمية المتاحة"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">سعر الشراء (دينار تونسي)</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.purchase_price}
                    min="0"
                    step="0.01"
                    onChange={(e) => setFormData({...formData, purchase_price: parseFloat(e.target.value) || 0})}
                    placeholder="سعر الشراء"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المورد</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    placeholder="اسم المورد"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الشراء</label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-3 py-1.5 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  إلغاء
                </button>
                <button
                  className="px-3 py-1.5 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAddCarton}
                  disabled={!formData.type || !formData.capacity || formData.available_quantity === undefined}
                >
                  إضافة الشقف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Carton Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
              <div className="bg-slate-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Edit className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">تعديل الشقف</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع الشقف</label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="">اختر نوع الشقف</option>
                    {cartonTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">السعة (عدد البيض)</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.capacity}
                    min="30"
                    readOnly
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الكمية المتاحة</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.available_quantity}
                    min="0"
                    onChange={(e) => setFormData({...formData, available_quantity: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">سعر الشراء (دينار تونسي)</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.purchase_price}
                    min="0"
                    step="0.01"
                    onChange={(e) => setFormData({...formData, purchase_price: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المورد</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الشراء</label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-3 py-1.5 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                >
                  إلغاء
                </button>
                <button
                  className="px-3 py-1.5 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors duration-200"
                  onClick={handleEditCarton}
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
                    <h3 className="text-lg font-semibold">حذف الشقف</h3>
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
                  الشقف: <span className="font-semibold">{selectedCarton && getCartonTypeLabel(selectedCarton.type)}</span>
                  <br />
                  سيتم حذف جميع البيانات المرتبطة بهذا الشقف بشكل نهائي.
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
                  onClick={handleDeleteCarton}
                >
                  نعم، احذف الشقف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && (withdrawCarton || withdrawType) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
              <div className="bg-amber-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Box className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">
                      {withdrawCarton 
                        ? `سحب من المخزون - ${getCartonTypeLabel(withdrawCarton.type)}`
                        : `سحب من المخزون - ${getCartonTypeLabel(withdrawType as string)}`}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setShowWithdrawModal(false)}
                    className="p-1 hover:bg-amber-500 rounded-md transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الكمية المسحوبة</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors duration-200"
                    value={withdrawData.quantity}
                    min={1}
                    max={withdrawCarton ? withdrawCarton.available_quantity : (cartonsByType[withdrawType as string] || 0)}
                    onChange={(e) => setWithdrawData({...withdrawData, quantity: Math.max(1, parseInt(e.target.value) || 1)})}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    المتاح: {withdrawCarton ? withdrawCarton.available_quantity : (cartonsByType[withdrawType as string] || 0)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ السحب</label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors duration-200"
                    value={withdrawData.date}
                    onChange={(e) => setWithdrawData({...withdrawData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات (اختياري)</label>
                  <textarea
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors duration-200"
                    rows={3}
                    value={withdrawData.notes}
                    onChange={(e) => setWithdrawData({...withdrawData, notes: e.target.value})}
                    placeholder="سبب السحب أو مرجع العملية..."
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-3 py-1.5 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setShowWithdrawModal(false)}
                >
                  إلغاء
                </button>
                <button
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={async () => {
                    const qty = Math.max(1, withdrawData.quantity);
                    try {
                      let totalCost = 0;
                      let cartonTypeLabel = '';
                      
                      if (withdrawCarton) {
                        if (qty > withdrawCarton.available_quantity) return;
                        await databaseService.updateCarton(withdrawCarton.id, {
                          available_quantity: withdrawCarton.available_quantity - qty
                        });
                        // Log movement
                        await databaseService.addCartonMovement({
                          carton_id: withdrawCarton.id,
                          movement_type: 'out',
                          quantity: qty,
                          date: withdrawData.date,
                          reference: `سحب شقف نوع ${getCartonTypeLabel(withdrawCarton.type)}`,
                          notes: withdrawData.notes || ''
                        });
                        // Calculate total cost for expense
                        totalCost = withdrawCarton.purchase_price * qty;
                        cartonTypeLabel = getCartonTypeLabel(withdrawCarton.type);
                      } else if (withdrawType) {
                        // Deduct across cartons of this type
                        const sameType = cartons.filter(c => c.type === withdrawType && c.available_quantity > 0);
                        let remaining = qty;
                        for (const c of sameType) {
                          if (remaining <= 0) break;
                          const deduct = Math.min(remaining, c.available_quantity);
                          await databaseService.updateCarton(c.id, {
                            available_quantity: c.available_quantity - deduct
                          });
                          await databaseService.addCartonMovement({
                            carton_id: c.id,
                            movement_type: 'out',
                            quantity: deduct,
                            date: withdrawData.date,
                            reference: `سحب شقف نوع ${getCartonTypeLabel(c.type)}`,
                            notes: withdrawData.notes || ''
                          });
                          // Add to total cost
                          totalCost += c.purchase_price * deduct;
                          remaining -= deduct;
                        }
                        cartonTypeLabel = getCartonTypeLabel(withdrawType);
                      }
                      
                      // Create expense automatically for carton withdrawal
                      if (totalCost > 0) {
                        await databaseService.addExpense({
                          date: withdrawData.date,
                          category: 'supplies',
                          description: `سحب ${qty} شقف نوع ${cartonTypeLabel}`,
                          amount: totalCost,
                          supplier: withdrawCarton?.supplier || '',
                          notes: `مصروف تلقائي من سحب الشقوفات - ${withdrawData.notes || ''}`
                        });
                      }
                      
                      setShowWithdrawModal(false);
                      setWithdrawCarton(null);
                      setWithdrawType(null);
                      await loadData();
                    } catch (e) {
                      console.error('خطأ في سحب الشقف:', e);
                      alert('حدث خطأ أثناء سحب الشقف. يرجى المحاولة مرة أخرى.');
                    }
                  }}
                  disabled={
                    withdrawData.quantity < 1 || 
                    (withdrawCarton 
                      ? withdrawData.quantity > (withdrawCarton?.available_quantity || 0)
                      : withdrawData.quantity > (cartonsByType[withdrawType as string] || 0))
                  }
                >
                  تأكيد السحب
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartonManagement;