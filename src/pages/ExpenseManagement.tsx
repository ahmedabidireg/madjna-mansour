import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, DollarSign, X, Calendar, AlertTriangle, TrendingDown, Package, Droplets, Zap, Pill, Wheat, Filter, BarChart3, Receipt, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Expense } from '../types';
import { databaseService } from '../services/database';
import { formatCurrencyTND } from '../lib/format';
import { usePermissions } from '../hooks/usePermissions';
import Pagination from '../components/common/Pagination';

const ExpenseManagement: React.FC = () => {
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    category: 'feed',
    amount: 0,
    description: '',
    beneficiary: '',
    payment_status: 'paid'
  });
  const [sortField, setSortField] = useState<keyof Expense>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await databaseService.getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    try {
      await databaseService.addExpense(formData as Omit<Expense, 'id'>);
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('خطأ في إضافة المصروف:', error);
      alert('فشل إضافة المصروف. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleEditExpense = async () => {
    if (!selectedExpense) return;
    try {
      await databaseService.updateExpense(selectedExpense.id, formData);
      setShowEditModal(false);
      setSelectedExpense(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('خطأ في تعديل المصروف:', error);
      alert('فشل تعديل المصروف. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    
    // Validate that we have a valid ID
    const expenseId = selectedExpense.id || selectedExpense._id;
    if (!expenseId) {
      alert('خطأ: معرف المصروف غير صالح');
      return;
    }
    
    try {
      await databaseService.deleteExpense(expenseId);
      setShowDeleteModal(false);
      setSelectedExpense(null);
      loadData();
    } catch (error) {
      console.error('خطأ في حذف المصروف:', error);
      alert('فشل حذف المصروف. يرجى المحاولة مرة أخرى.');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: 'feed',
      amount: 0,
      description: '',
      beneficiary: '',
      payment_status: 'paid'
    });
  };

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      description: expense.description || '',
      beneficiary: expense.beneficiary || '',
      payment_status: expense.payment_status || 'unpaid'
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDeleteModal(true);
  };

  // تصفية وترتيب البيانات
  const filteredAndSortedExpenses = useMemo(() => {
    let result = [...expenses];
    
    // التصفية حسب الفئة
    if (filterCategory !== 'all') {
      result = result.filter(expense => expense.category === filterCategory);
    }
    
    // التصفية حسب حالة الدفع
    if (filterPaymentStatus !== 'all') {
      result = result.filter(expense => (expense.payment_status || 'paid') === filterPaymentStatus);
    }
    
    // الترتيب
    result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? new Date(aValue as string).getTime() - new Date(bValue as string).getTime()
          : new Date(bValue as string).getTime() - new Date(aValue as string).getTime();
      }
      
      if (sortField === 'amount') {
        return sortDirection === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
      
      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
    
    return result;
  }, [expenses, sortField, sortDirection, filterCategory, filterPaymentStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedExpenses.length / itemsPerPage);
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedExpenses.slice(startIndex, endIndex);
  }, [filteredAndSortedExpenses, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterPaymentStatus, sortField, sortDirection]);

  const handleSort = (field: keyof Expense) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Calculate statistics
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paidExpenses = expenses
    .filter(e => e.payment_status === 'paid')
    .reduce((sum, expense) => sum + expense.amount, 0);
  const unpaidExpenses = expenses
    .filter(e => e.payment_status === 'unpaid' || !e.payment_status)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const partialExpenses = expenses
    .filter(e => e.payment_status === 'partial')
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  // Today's expenses
  const today = new Date().toISOString().split('T')[0];
  const todayExpenses = expenses
    .filter(expense => expense.date === today)
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Monthly expenses (current month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Category icons and colors
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'feed': return Wheat;
      case 'medicine': return Pill;
      case 'water': return Droplets;
      case 'electricity': return Zap;
      case 'supplies': return Package;
      case 'paid': return CheckCircle;
      default: return DollarSign;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feed': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'bg-amber-100 text-amber-600' };
      case 'medicine': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'bg-red-100 text-red-600' };
      case 'water': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'bg-blue-100 text-blue-600' };
      case 'electricity': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'bg-yellow-100 text-yellow-600' };
      case 'supplies': return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'bg-purple-100 text-purple-600' };
      default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: 'bg-gray-100 text-gray-600' };
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'feed': return 'علف';
      case 'medicine': return 'دواء';
      case 'water': return 'ماء';
      case 'electricity': return 'كهرباء';
      case 'supplies': return 'مستلزمات';
      case 'paid': return 'خلاص خدام';
      default: return category;
    }
  };

  // Check read permission
  if (!canRead('expenses')) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد صلاحية</h3>
          <p className="text-gray-600">ليس لديك صلاحية لعرض المصروفات</p>
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
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="bg-slate-600 p-3 rounded-md">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">
                  إدارة المصروفات
                </h1>
                <p className="text-gray-600 mt-1">تتبع وإدارة جميع مصروفات المزرعة</p>
              </div>
            </div>
            {canCreate('expenses') && (
              <button 
                className="bg-slate-600 hover:bg-slate-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 rtl:space-x-reverse transition-colors duration-200 text-sm sm:text-base"
                onClick={() => setShowAddModal(true)}
                title="إضافة مصروف جديد"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">إضافة مصروف جديد</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">مصروفات اليوم</p>
                <p className="text-2xl font-semibold text-slate-800">{formatCurrencyTND(todayExpenses)}</p>
                <p className="text-xs text-slate-600 mt-1 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  اليوم
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-md">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">مصروفات الشهر</p>
                <p className="text-2xl font-semibold text-slate-800">{formatCurrencyTND(monthlyExpenses)}</p>
                <p className="text-xs text-slate-600 mt-1 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  الشهر الحالي
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-md">
                <TrendingDown className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">إجمالي المصروفات</p>
                <p className="text-2xl font-semibold text-slate-800">{formatCurrencyTND(totalExpenses)}</p>
                <p className="text-xs text-slate-600 mt-1 flex items-center">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  جميع الفترات
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
                <p className="text-sm font-medium text-gray-600 mb-1">خلاص خدام</p>
                <p className="text-2xl font-semibold text-green-600">{formatCurrencyTND(paidExpenses)}</p>
                <p className="text-xs text-slate-600 mt-1 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  مدفوع بالكامل
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-md">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">غير مدفوع</p>
                <p className="text-2xl font-semibold text-red-600">{formatCurrencyTND(unpaidExpenses)}</p>
                <p className="text-xs text-slate-600 mt-1 flex items-center">
                  <XCircle className="h-3 w-3 mr-1" />
                  لم يتم الدفع
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-md">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>


        {/* Category Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {['feed', 'medicine', 'water', 'electricity', 'supplies', 'paid'].map((category) => {
            const Icon = getCategoryIcon(category);
            const amount = expensesByCategory[category] || 0;
            const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
            const colors = getCategoryColor(category);
            
            return (
              <div key={category} className={`${colors.bg} rounded-lg p-5 shadow-md border-2 ${colors.border} hover:shadow-md transition-shadow duration-200`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-lg ${colors.icon} shadow-sm`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-sm font-bold ${colors.text} bg-white/50 px-2 py-1 rounded-full`}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <h4 className={`font-bold ${colors.text} text-base mb-2`}>{getCategoryName(category)}</h4>
                <p className={`text-2xl font-extrabold ${colors.text}`}>{formatCurrencyTND(amount)}</p>
                <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${colors.icon} transition-all duration-500`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-600 p-6">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Receipt className="h-5 w-5 text-white" />
              <h3 className="text-lg font-semibold text-white">سجل المصروفات</h3>
            </div>
          </div>
          
          {filteredAndSortedExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Receipt className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد مصروفات مسجلة</h3>
              <p className="text-gray-500 mb-6">ابدأ بتسجيل أول مصروف للمزرعة</p>
              <button 
                className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 rtl:space-x-reverse mx-auto transition-colors duration-200"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-5 w-5" />
                <span>إضافة مصروف جديد</span>
              </button>
            </div>
          ) : (
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center">
                        التاريخ
                        {sortField === 'date' && (
                          <span className="mr-1 text-slate-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center">
                        الفئة
                        {sortField === 'category' && (
                          <span className="mr-1 text-slate-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center">
                        المبلغ
                        {sortField === 'amount' && (
                          <span className="mr-1 text-slate-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      الوصف
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      المستفيد
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      حالة الدفع
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedExpenses.map((expense, index) => {
                    const Icon = getCategoryIcon(expense.category);
                    const colors = getCategoryColor(expense.category);
                    
                    return (
                      <tr key={expense.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-gray-100 p-2 rounded-lg mr-3">
                              <Calendar className="h-4 w-4 text-gray-600" />
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {new Date(expense.date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg mr-3 ${colors.icon} shadow-sm`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className={`text-sm font-semibold ${colors.text}`}>
                              {getCategoryName(expense.category)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-red-600">
                            {formatCurrencyTND(expense.amount)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                          <span className="text-sm text-gray-900 max-w-xs truncate block">
                            {expense.description || '-'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 font-medium">
                            {expense.beneficiary || '-'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                          {(() => {
                            const status = expense.payment_status || 'unpaid';
                            if (status === 'paid') {
                              return (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  خالص
                                </span>
                              );
                            } else if (status === 'partial') {
                              return (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                  <Clock className="h-3 w-3 mr-1" />
                                  جزئي
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  غير مدفوع
                                </span>
                              );
                            }
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            {canUpdate('expenses') && (
                              <button 
                                className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                                onClick={() => openEditModal(expense)}
                                title="تعديل المصروف"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete('expenses') && (
                              <button 
                                className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                                onClick={() => openDeleteModal(expense)}
                                title="حذف المصروف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            {!canUpdate('expenses') && !canDelete('expenses') && (
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
            {paginatedExpenses.map((expense) => {
              const Icon = getCategoryIcon(expense.category);
              const colors = getCategoryColor(expense.category);
              const status = expense.payment_status || 'paid';
              
              return (
                <div key={expense.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse flex-1">
                      <div className={`p-2 rounded-lg ${colors.icon} shadow-sm`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-semibold ${colors.text} truncate`}>
                          {getCategoryName(expense.category)}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(expense.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {canUpdate('expenses') && (
                        <button
                          onClick={() => openEditModal(expense)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete('expenses') && (
                        <button
                          onClick={() => openDeleteModal(expense)}
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
                      <span className="text-xs text-gray-600">المبلغ:</span>
                      <span className="text-lg font-bold text-red-600">
                        {formatCurrencyTND(expense.amount)}
                      </span>
                    </div>
                    
                    {expense.description && (
                      <div>
                        <span className="text-xs text-gray-600">الوصف:</span>
                        <p className="text-sm text-gray-900 mt-0.5">{expense.description}</p>
                      </div>
                    )}
                    
                    {expense.beneficiary && (
                      <div>
                        <span className="text-xs text-gray-600">المستفيد:</span>
                        <p className="text-sm text-gray-900 mt-0.5">{expense.beneficiary}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-600">حالة الدفع:</span>
                      {status === 'paid' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          خالص
                        </span>
                      ) : status === 'partial' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          جزئي
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          غير مدفوع
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {filteredAndSortedExpenses.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredAndSortedExpenses.length}
            />
          )}
        </div>

        {/* Add Expense Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
              <div className="bg-slate-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <DollarSign className="h-6 w-6" />
                    <h3 className="text-lg font-semibold">إضافة مصروف جديد</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">التاريخ</label>
                  <input
                    type="date"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الفئة</label>
                  <select
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                  >
                    <option value="feed">علف</option>
                    <option value="medicine">دواء</option>
                    <option value="water">ماء</option>
                    <option value="electricity">كهرباء</option>
                    <option value="supplies">مستلزمات</option>
                    <option value="paid">خلاص خدام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">المبلغ (دينار تونسي)</label>
                  <input
                    type="number"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200"
                    value={formData.amount}
                    min="0"
                    step="0.01"
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    placeholder="أدخل المبلغ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الوصف</label>
                  <textarea
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="وصف تفصيلي للمصروف..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">المستفيد (اختياري)</label>
                  <input
                    type="text"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200"
                    value={formData.beneficiary}
                    onChange={(e) => setFormData({...formData, beneficiary: e.target.value})}
                    placeholder="اسم المستفيد أو الشركة"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  إلغاء
                </button>
                <button
                  className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors duration-200"
                  onClick={handleAddExpense}
                  disabled={!formData.date || !formData.amount}
                >
                  إضافة المصروف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Expense Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
              <div className="bg-slate-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Edit className="h-6 w-6" />
                    <h3 className="text-lg font-semibold">تعديل المصروف</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">التاريخ</label>
                  <input
                    type="date"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الفئة</label>
                  <select
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                  >
                    <option value="feed">علف</option>
                    <option value="medicine">دواء</option>
                    <option value="water">ماء</option>
                    <option value="electricity">كهرباء</option>
                    <option value="supplies">مستلزمات</option>
                    <option value="paid">خلاص خدام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">المبلغ (دينار تونسي)</label>
                  <input
                    type="number"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200"
                    value={formData.amount}
                    min="0"
                    step="0.01"
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">حالة الدفع</label>
                  <select
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200"
                    value={formData.payment_status || 'paid'}
                    onChange={(e) => setFormData({...formData, payment_status: e.target.value as 'paid' | 'unpaid' | 'partial'})}
                  >
                    <option value="unpaid">غير مدفوع</option>
                    <option value="paid">خالص</option>
                    <option value="partial">مدفوع جزئياً</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الوصف</label>
                  <textarea
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">المستفيد</label>
                  <input
                    type="text"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200"
                    value={formData.beneficiary}
                    onChange={(e) => setFormData({...formData, beneficiary: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                >
                  إلغاء
                </button>
                <button
                  className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all duration-200 font-semibold transition-colors duration-200"
                  onClick={handleEditExpense}
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
              <div className="bg-red-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <AlertTriangle className="h-6 w-6" />
                    <h3 className="text-lg font-semibold">تأكيد الحذف</h3>
                  </div>
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="text-center">
                  <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <AlertTriangle className="h-10 w-10 text-red-600" />
                  </div>
                  <p className="text-gray-700 text-lg font-semibold mb-2">هل أنت متأكد من أنك تريد حذف هذا المصروف؟</p>
                  <p className="text-red-600 font-bold text-2xl mb-2">
                    {selectedExpense && `${formatCurrencyTND(selectedExpense.amount)} - ${getCategoryName(selectedExpense.category)}`}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">هذا الإجراء لا يمكن التراجع عنه</p>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold"
                  onClick={() => setShowDeleteModal(false)}
                >
                  إلغاء
                </button>
                <button
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-semibold transition-colors duration-200"
                  onClick={handleDeleteExpense}
                >
                  حذف نهائياً
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseManagement;
