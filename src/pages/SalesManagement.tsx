import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, DollarSign, X, Calendar, FileText, ShoppingCart, Receipt, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Sale, Client, SaleItem } from '../types';
import { databaseService } from '../services/database';
import { formatCurrencyTND } from '../lib/format';
import { usePermissions } from '../hooks/usePermissions';
import Pagination from '../components/common/Pagination';

const SalesManagement: React.FC = () => {
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [chickens, setChickens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddSaleModal, setShowAddSaleModal] = useState(false);
  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  // Sale form data
  const [saleFormData, setSaleFormData] = useState<Partial<Sale>>({
    sale_date: new Date().toISOString().split('T')[0],
    client_name: '',
    client_phone: '',
    items: [],
    total_amount: 0,
    payment_status: 'pending',
    payment_method: 'cash',
    invoice_number: '',
    notes: ''
  });

  // Current sale item being added
  const [currentItem, setCurrentItem] = useState<Partial<SaleItem>>({
    product_type: 'eggs',
    batch_number: '',
    quantity: 0,
    unit_price: 0,
    total_price: 0,
    description: ''
  });

  const productTypes = [
    { value: 'eggs', label: 'بيض', unit: 'بيضة' },
    { value: 'chicken', label: 'دجاج', unit: 'دجاجة' },
    { value: 'carton', label: 'شقفة', unit: 'شقفة' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Auto-calculate total price for current item
    if (currentItem.quantity && currentItem.unit_price) {
      setCurrentItem(prev => ({
        ...prev,
        total_price: (prev.quantity || 0) * (prev.unit_price || 0)
      }));
    }
  }, [currentItem.quantity, currentItem.unit_price]);

  useEffect(() => {
    // Auto-calculate total amount for sale
    const total = saleFormData.items?.reduce((sum, item) => sum + item.total_price, 0) || 0;
    setSaleFormData(prev => ({
      ...prev,
      total_amount: total
    }));
  }, [saleFormData.items]);

  useEffect(() => {
    // Generate invoice number
    if (showAddSaleModal && !saleFormData.invoice_number) {
      const invoiceNumber = `INV-${Date.now()}`;
      setSaleFormData(prev => ({
        ...prev,
        invoice_number: invoiceNumber
      }));
    }
  }, [showAddSaleModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesData, clientsData, chickensData] = await Promise.all([
        databaseService.getSales(),
        databaseService.getClients(),
        databaseService.getChickens()
      ]);
      setSales(salesData);
      setClients(clientsData);
      setChickens(chickensData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSale = async () => {
    try {
      await databaseService.addSale(saleFormData as Omit<Sale, 'id'>);
      setShowAddSaleModal(false);
      resetSaleForm();
      loadData();
    } catch (error) {
      console.error('خطأ في إضافة البيع:', error);
    }
  };

  const handleEditSale = async () => {
    if (!selectedSale) return;
    try {
      await databaseService.updateSale(selectedSale.id, saleFormData);
      setShowEditSaleModal(false);
      setSelectedSale(null);
      resetSaleForm();
      loadData();
    } catch (error) {
      console.error('خطأ في تعديل البيع:', error);
    }
  };

  const handleDeleteSale = async () => {
    if (!selectedSale) return;
    try {
      await databaseService.deleteSale(selectedSale.id);
      setShowDeleteModal(false);
      setSelectedSale(null);
      loadData();
    } catch (error) {
      console.error('خطأ في حذف البيع:', error);
    }
  };

  const resetSaleForm = () => {
    setSaleFormData({
      sale_date: new Date().toISOString().split('T')[0],
      client_name: '',
      client_phone: '',
      items: [],
      total_amount: 0,
      payment_status: 'pending',
      payment_method: 'cash',
      invoice_number: '',
      notes: ''
    });
    setCurrentItem({
      product_type: 'eggs',
      quantity: 0,
      unit_price: 0,
      total_price: 0,
      description: ''
    });
  };

  const addItemToSale = () => {
    if (!currentItem.quantity || !currentItem.unit_price) return;
    
    const newItem: SaleItem = {
      id: crypto.randomUUID(),
      product_type: currentItem.product_type as 'eggs' | 'chicken' | 'carton',
      batch_number: currentItem.product_type === 'eggs' ? (currentItem.batch_number || undefined) : undefined,
      quantity: currentItem.quantity,
      unit_price: currentItem.unit_price,
      total_price: currentItem.total_price || 0,
      description: currentItem.description || ''
    };

    setSaleFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));

    // Reset current item
    setCurrentItem({
      product_type: 'eggs',
      batch_number: '',
      quantity: 0,
      unit_price: 0,
      total_price: 0,
      description: ''
    });
  };

  const removeItemFromSale = (itemId: string) => {
    setSaleFormData(prev => ({
      ...prev,
      items: prev.items?.filter(item => item.id !== itemId) || []
    }));
  };

  // Edit helpers
  const updateSaleItem = (index: number, changes: Partial<SaleItem>) => {
    setSaleFormData(prev => {
      const items = [...(prev.items || [])];
      const original = items[index];
      const updated: SaleItem = {
        ...original,
        ...changes,
      };
      // auto calc total_price if qty/price changed
      const qty = changes.quantity !== undefined ? changes.quantity : original.quantity;
      const price = changes.unit_price !== undefined ? changes.unit_price : original.unit_price;
      updated.total_price = (qty || 0) * (price || 0);
      items[index] = updated;
      return { ...prev, items };
    });
  };

  const removeItemFromEdit = (index: number) => {
    setSaleFormData(prev => {
      const items = [...(prev.items || [])];
      items.splice(index, 1);
      return { ...prev, items };
    });
  };

  const addItemToEdit = () => {
    if (!currentItem.quantity || !currentItem.unit_price || !currentItem.product_type) return;
    const newItem: SaleItem = {
      id: crypto.randomUUID(),
      product_type: currentItem.product_type,
      batch_number: currentItem.product_type === 'eggs' ? currentItem.batch_number : undefined,
      quantity: currentItem.quantity,
      unit_price: currentItem.unit_price,
      total_price: (currentItem.quantity || 0) * (currentItem.unit_price || 0),
      description: currentItem.description || ''
    };
    setSaleFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
    setCurrentItem({
      product_type: 'eggs',
      quantity: 0,
      unit_price: 0,
      total_price: 0,
      description: ''
    });
  };

  const selectClient = (client: Client) => {
    setSaleFormData(prev => ({
      ...prev,
      client_id: client.id,
      client_name: client.name,
      client_phone: client.phone
    }));
  };

  const openEditModal = (sale: Sale) => {
    setSelectedSale(sale);
    setSaleFormData({
      sale_date: sale.sale_date,
      client_id: sale.client_id,
      client_name: sale.client_name,
      client_phone: sale.client_phone,
      items: sale.items,
      total_amount: sale.total_amount,
      payment_status: sale.payment_status,
      payment_method: sale.payment_method,
      invoice_number: sale.invoice_number,
      notes: sale.notes || ''
    });
    setShowEditSaleModal(true);
  };

  const openDeleteModal = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDeleteModal(true);
  };

  const openInvoiceModal = (sale: Sale) => {
    setSelectedSale(sale);
    setShowInvoiceModal(true);
  };

  const getProductTypeLabel = (type: string) => {
    return productTypes.find(pt => pt.value === type)?.label || type;
  };

  const getProductTypeUnit = (type: string) => {
    return productTypes.find(pt => pt.value === type)?.unit || '';
  };

  // Calculate statistics
  const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const monthlyRevenue = sales
    .filter(sale => {
      const saleDate = new Date(sale.sale_date);
      const now = new Date();
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, sale) => sum + sale.total_amount, 0);

  // Today's sales (normalize backend ISO strings before comparing)
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales
    .filter((sale) => {
      const normalizedSaleDate = typeof sale.sale_date === 'string'
        ? sale.sale_date.split('T')[0]
        : new Date(sale.sale_date).toISOString().split('T')[0];
      return normalizedSaleDate === today;
    })
    .reduce((sum, sale) => sum + sale.total_amount, 0);

  // Pending payments
  const pendingPayments = sales
    .filter(sale => sale.payment_status === 'pending' || sale.payment_status === 'partial')
    .reduce((sum, sale) => sum + sale.total_amount, 0);

  const sortedSales = useMemo(() => {
    return [...sales].sort((a, b) => {
      const dateA = new Date(a.sale_date).getTime();
      const dateB = new Date(b.sale_date).getTime();
      if (dateA === dateB) {
        return (b.id || '').localeCompare(a.id || '');
      }
      return dateB - dateA;
    });
  }, [sales]);

  // Pagination
  const totalPages = Math.ceil(sales.length / itemsPerPage);
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedSales.slice(startIndex, endIndex);
  }, [sortedSales, currentPage, itemsPerPage]);

  // Check read permission
  if (!canRead('sales')) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد صلاحية</h3>
          <p className="text-gray-600">ليس لديك صلاحية لعرض المبيعات</p>
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
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">
                  إدارة المبيعات
                </h1>
                <p className="text-gray-600 mt-1">تسجيل المبيعات وإدارة العملاء والفواتير</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
              {canCreate('sales') && (
                <button 
                  className="bg-slate-600 hover:bg-slate-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 rtl:space-x-reverse transition-colors duration-200 text-sm sm:text-base"
                  onClick={() => setShowAddSaleModal(true)}
                  title="بيع جديد"
                >
                  <Plus className="h-5 w-5" />
                  <span className="hidden sm:inline font-medium">بيع جديد</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">مبيعات اليوم</p>
                <p className="text-2xl font-semibold text-slate-800">{formatCurrencyTND(todaySales)}</p>
                <p className="text-xs text-slate-600 mt-1 flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  دينار
                </p>
              </div>
              <div className="bg-slate-100 p-3 rounded-md">
                <DollarSign className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">إيرادات الشهر</p>
                <p className="text-2xl font-semibold text-slate-800">{formatCurrencyTND(monthlyRevenue)}</p>
                <p className="text-xs text-slate-600 mt-1 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  الشهر الحالي
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
                <p className="text-sm font-medium text-gray-600 mb-1">إجمالي المبيعات</p>
                <p className="text-2xl font-semibold text-slate-800">{formatCurrencyTND(totalSales)}</p>
                <p className="text-xs text-slate-600 mt-1 flex items-center">
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  جميع المبيعات
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-md">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">مدفوعات معلقة</p>
                <p className="text-2xl font-semibold text-slate-800">{formatCurrencyTND(pendingPayments)}</p>
                <p className="text-xs text-slate-600 mt-1 flex items-center">
                  <FileText className="h-3 w-3 mr-1" />
                  غير مدفوعة
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-md">
                <TrendingDown className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-600 p-6">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <ShoppingCart className="h-5 w-5 text-white" />
              <h3 className="text-lg font-semibold text-white">سجل المبيعات</h3>
            </div>
          </div>
          
          {sales.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مبيعات مسجلة</h3>
              <p className="text-gray-500 mb-6">ابدأ بتسجيل أول عملية بيع</p>
              <button 
                className="bg-slate-600 hover:bg-slate-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 rtl:space-x-reverse mx-auto transition-colors duration-200 text-sm sm:text-base"
                onClick={() => setShowAddSaleModal(true)}
                title="بيع جديد"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">بيع جديد</span>
              </button>
            </div>
          ) : (
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      رقم الفاتورة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      العميل
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      المبلغ الإجمالي
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      حالة الدفع
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      طريقة الدفع
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedSales.map((sale, index) => (
                    <tr key={sale.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{sale.invoice_number}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-lg mr-3">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(sale.sale_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{sale.client_name}</div>
                          {sale.client_phone && (
                            <div className="text-sm text-gray-500">{sale.client_phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-gray-900">{formatCurrencyTND(sale.total_amount)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          sale.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : sale.payment_status === 'partial'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {sale.payment_status === 'paid' ? 'مدفوع' : 
                           sale.payment_status === 'partial' ? 'جزئي' : 'معلق'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {sale.payment_method === 'cash' ? 'نقدي' :
                           sale.payment_method === 'transfer' ? 'تحويل' : 'شيك'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <button 
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors duration-200"
                            onClick={() => openInvoiceModal(sale)}
                            title="عرض الفاتورة"
                          >
                            <Receipt className="h-4 w-4" />
                          </button>
                          {canUpdate('sales') && (
                            <button 
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                              onClick={() => openEditModal(sale)}
                              title="تعديل البيع"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete('sales') && (
                            <button 
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                              onClick={() => openDeleteModal(sale)}
                              title="حذف البيع"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          {!canUpdate('sales') && !canDelete('sales') && (
                            <span className="text-gray-400 text-xs">لا توجد صلاحيات</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Cards View */}
          <div className="lg:hidden space-y-4 mt-4">
            {paginatedSales.map((sale) => {
              return (
                <div key={sale.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse flex-1">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800 truncate">
                          {sale.invoice_number}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{sale.client_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <button 
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        onClick={() => openInvoiceModal(sale)}
                        title="عرض الفاتورة"
                      >
                        <Receipt className="h-4 w-4" />
                      </button>
                      {canUpdate('sales') && (
                        <button 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          onClick={() => openEditModal(sale)}
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete('sales') && (
                        <button 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => openDeleteModal(sale)}
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">التاريخ:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(sale.sale_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">المبلغ الإجمالي:</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrencyTND(sale.total_amount)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">حالة الدفع:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        sale.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : sale.payment_status === 'partial'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sale.payment_status === 'paid' ? 'مدفوع' : 
                         sale.payment_status === 'partial' ? 'جزئي' : 'معلق'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {sales.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={sales.length}
            />
          )}
        </div>

        {/* Add Sale Modal */}
        {showAddSaleModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="bg-slate-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <ShoppingCart className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">بيع جديد</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setShowAddSaleModal(false);
                      resetSaleForm();
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Sale Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ</label>
                    <input
                      type="date"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={saleFormData.sale_date}
                      onChange={(e) => setSaleFormData({...saleFormData, sale_date: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">رقم الفاتورة</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={saleFormData.invoice_number}
                      onChange={(e) => setSaleFormData({...saleFormData, invoice_number: e.target.value})}
                      placeholder="رقم الفاتورة"
                    />
                  </div>
                </div>

                {/* Client Selection */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">معلومات العميل</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">اختر عميل موجود</label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        onChange={(e) => {
                          const client = clients.find(c => c.id === e.target.value);
                          if (client) selectClient(client);
                        }}
                        value={saleFormData.client_id || ''}
                      >
                        <option value="">اختر عميل</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name} - {client.phone}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">اسم العميل</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={saleFormData.client_name}
                        onChange={(e) => setSaleFormData({...saleFormData, client_name: e.target.value})}
                        placeholder="اسم العميل"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                      <input
                        type="tel"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={saleFormData.client_phone}
                        onChange={(e) => setSaleFormData({...saleFormData, client_phone: e.target.value})}
                        placeholder="رقم الهاتف"
                      />
                    </div>
                  </div>
                </div>

                {/* Add Items */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3">إضافة منتج</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">نوع المنتج</label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={currentItem.product_type}
                        onChange={(e) => setCurrentItem({...currentItem, product_type: e.target.value as 'eggs' | 'chicken' | 'carton', batch_number: e.target.value === 'eggs' ? currentItem.batch_number : ''})}
                      >
                        {productTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {currentItem.product_type === 'eggs' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">رقم الدفعة *</label>
                        <select
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          value={currentItem.batch_number || ''}
                          onChange={(e) => setCurrentItem({...currentItem, batch_number: e.target.value})}
                          required
                        >
                          <option value="">اختر الدفعة</option>
                          {chickens.filter(c => c.status === 'alive' && (c.current_stock || 0) > 0).map((chicken) => (
                            <option key={chicken.id} value={chicken.batch_number}>
                              {chicken.batch_number} - {chicken.breed} (المخزون: {chicken.current_stock || 0})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الكمية</label>
                      <input
                        type="number"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={currentItem.quantity}
                        min="0"
                        max={currentItem.product_type === 'eggs' && currentItem.batch_number ? (() => {
                          const batch = chickens.find(c => c.batch_number === currentItem.batch_number);
                          return batch?.current_stock || 0;
                        })() : undefined}
                        onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 0})}
                        placeholder="الكمية"
                      />
                      {currentItem.product_type === 'eggs' && currentItem.batch_number && (
                        <p className="text-xs text-gray-500 mt-1">
                          متوفر: {(() => {
                            const batch = chickens.find(c => c.batch_number === currentItem.batch_number);
                            return batch?.current_stock || 0;
                          })()}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">سعر الوحدة</label>
                      <input
                        type="number"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={currentItem.unit_price}
                        min="0"
                        step="0.01"
                        onChange={(e) => setCurrentItem({...currentItem, unit_price: parseFloat(e.target.value) || 0})}
                        placeholder="السعر"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الإجمالي</label>
                      <input
                        type="number"
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                        value={currentItem.total_price}
                        readOnly
                        placeholder="الإجمالي"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        type="button"
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={addItemToSale}
                        disabled={!currentItem.quantity || !currentItem.unit_price || (currentItem.product_type === 'eggs' && !currentItem.batch_number)}
                      >
                        إضافة
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                {saleFormData.items && saleFormData.items.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">المنتجات المضافة</h4>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">المنتج</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الكمية</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">سعر الوحدة</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الإجمالي</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">إجراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {saleFormData.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {getProductTypeLabel(item.product_type)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {item.quantity} {getProductTypeUnit(item.product_type)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatCurrencyTND(item.unit_price)}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {formatCurrencyTND(item.total_price)}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  className="text-red-600 hover:text-red-800 p-1 rounded"
                                  onClick={() => removeItemFromSale(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 text-right">
                      <span className="text-lg font-bold text-gray-900">
                        الإجمالي: {saleFormData.total_amount !== undefined ? formatCurrencyTND(saleFormData.total_amount) : formatCurrencyTND(0)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Payment Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">حالة الدفع</label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={saleFormData.payment_status}
                      onChange={(e) => setSaleFormData({...saleFormData, payment_status: e.target.value as 'paid' | 'pending' | 'partial'})}
                    >
                      <option value="pending">معلق</option>
                      <option value="partial">جزئي</option>
                      <option value="paid">مدفوع</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الدفع</label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={saleFormData.payment_method}
                      onChange={(e) => setSaleFormData({...saleFormData, payment_method: e.target.value as 'cash' | 'transfer' | 'check'})}
                    >
                      <option value="cash">نقدي</option>
                      <option value="transfer">تحويل</option>
                      <option value="check">شيك</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows={3}
                    value={saleFormData.notes}
                    onChange={(e) => setSaleFormData({...saleFormData, notes: e.target.value})}
                    placeholder="أي ملاحظات إضافية..."
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => {
                    setShowAddSaleModal(false);
                    resetSaleForm();
                  }}
                >
                  إلغاء
                </button>
                <button
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAddSale}
                  disabled={!saleFormData.client_name || !saleFormData.items?.length}
                >
                  حفظ البيع
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Sale Modal */}
        {showEditSaleModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="bg-slate-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Edit className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">تعديل البيع</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setShowEditSaleModal(false);
                      resetSaleForm();
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Sale Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ</label>
                    <input
                      type="date"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={saleFormData.sale_date}
                      onChange={(e) => setSaleFormData({...saleFormData, sale_date: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">رقم الفاتورة</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={saleFormData.invoice_number}
                      onChange={(e) => setSaleFormData({...saleFormData, invoice_number: e.target.value})}
                      placeholder="رقم الفاتورة"
                    />
                  </div>
                </div>

                {/* Client Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">بيانات العميل</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">اسم العميل</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={saleFormData.client_name}
                        onChange={(e) => setSaleFormData({...saleFormData, client_name: e.target.value})}
                        placeholder="اسم العميل"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                      <input
                        type="tel"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={saleFormData.client_phone}
                        onChange={(e) => setSaleFormData({...saleFormData, client_phone: e.target.value})}
                        placeholder="رقم الهاتف"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={saleFormData.notes}
                        onChange={(e) => setSaleFormData({...saleFormData, notes: e.target.value})}
                        placeholder="ملاحظات"
                      />
                    </div>
                  </div>
                </div>

                {/* Items Editor */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                    <h4 className="font-medium text-gray-900">المنتجات</h4>
                  </div>
                  <div className="p-4">
                    {(saleFormData.items || []).length === 0 ? (
                      <p className="text-gray-500 text-sm">لا توجد منتجات. أضف منتجاً جديداً أدناه.</p>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-right text-sm text-gray-600">المنتج</th>
                            <th className="px-3 py-2 text-right text-sm text-gray-600">الكمية</th>
                            <th className="px-3 py-2 text-right text-sm text-gray-600">سعر الوحدة</th>
                            <th className="px-3 py-2 text-right text-sm text-gray-600">الإجمالي</th>
                            <th className="px-3 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {saleFormData.items?.map((item, idx) => (
                            <tr key={item.id}>
                              <td className="px-3 py-2 text-sm text-gray-800">{getProductTypeLabel(item.product_type)}</td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  className="w-24 p-2 border rounded"
                                  value={item.quantity}
                                  min={0}
                                  onChange={(e) => updateSaleItem(idx, { quantity: parseInt(e.target.value) || 0 })}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  className="w-28 p-2 border rounded"
                                  value={item.unit_price}
                                  min={0}
                                  step="0.01"
                                  onChange={(e) => updateSaleItem(idx, { unit_price: parseFloat(e.target.value) || 0 })}
                                />
                              </td>
                              <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                {formatCurrencyTND(item.total_price)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  className="text-red-600 hover:text-red-800 text-sm"
                                  onClick={() => removeItemFromEdit(idx)}
                                >
                                  حذف
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  
                  {/* Add item inside edit */}
                  <div className="px-4 pb-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">نوع المنتج</label>
                          <select
                            className="w-full p-2 border rounded"
                            value={currentItem.product_type}
                            onChange={(e) => setCurrentItem({...currentItem, product_type: e.target.value as 'eggs' | 'chicken' | 'carton'})}
                          >
                            {productTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">الكمية</label>
                          <input
                            type="number"
                            className="w-full p-2 border rounded"
                            value={currentItem.quantity}
                            min={0}
                            onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">سعر الوحدة</label>
                          <input
                            type="number"
                            className="w-full p-2 border rounded"
                            value={currentItem.unit_price}
                            min={0}
                            step="0.01"
                            onChange={(e) => setCurrentItem({...currentItem, unit_price: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">الإجمالي</label>
                          <input
                            type="number"
                            className="w-full p-2 border rounded bg-gray-50"
                            value={(currentItem.quantity || 0) * (currentItem.unit_price || 0)}
                            readOnly
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
                            onClick={addItemToEdit}
                            disabled={!currentItem.quantity || !currentItem.unit_price}
                          >
                            إضافة منتج
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">
                    الإجمالي: {saleFormData.total_amount !== undefined ? formatCurrencyTND(saleFormData.total_amount) : formatCurrencyTND(0)}
                  </span>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => {
                    setShowEditSaleModal(false);
                    resetSaleForm();
                  }}
                >
                  إلغاء
                </button>
                <button
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200"
                  onClick={handleEditSale}
                  disabled={!saleFormData.client_name || !(saleFormData.items && saleFormData.items.length)}
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
                    <Trash2 className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">حذف البيع</h3>
                  </div>
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-center text-gray-600 p-4">هل أنت متأكد من حذف عملية البيع هذه؟</p>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setShowDeleteModal(false)}
                >
                  إلغاء
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                  onClick={handleDeleteSale}
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Modal */}
        {showInvoiceModal && selectedSale && (() => {
          const client = clients.find(c => c.id === selectedSale.client_id);
          const taxId = client?.tax_id || '';
          const clientAddress = client?.address || '';
          const invoiceDate = new Date(selectedSale.sale_date).toLocaleDateString('fr-FR');
          
          return (
            <div id="invoice-container" className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg w-full max-w-3xl shadow-lg max-h-[90vh] overflow-y-auto invoice-content">
                <div className="bg-slate-600 p-6 rounded-t-lg print:hidden">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Receipt className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">فاتورة البيع</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          // Get invoice content div (the inner white box)
                          const invoiceContainer = document.getElementById('invoice-container');
                          if (!invoiceContainer) return;
                          
                          // Get the inner content div
                          const innerContent = invoiceContainer.querySelector('.bg-white.rounded-lg') as HTMLElement;
                          if (!innerContent) return;
                          
                          // Clone the inner content
                          const invoiceClone = innerContent.cloneNode(true) as HTMLElement;
                          
                          // Remove buttons and hidden elements
                          invoiceClone.querySelectorAll('button, .print\\:hidden, [class*="print:hidden"]').forEach(el => el.remove());
                          
                          // Get only the invoice HTML without all the Tailwind classes
                          const invoiceHTML = invoiceClone.innerHTML;
                          
                          // Create new window for printing
                          const printWindow = window.open('', '_blank');
                          if (!printWindow) {
                            alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
                            return;
                          }
                          
                          printWindow.document.write(`
                            <!DOCTYPE html>
                            <html dir="rtl" lang="ar">
                              <head>
                                <meta charset="UTF-8">
                                <title>فاتورة</title>
                                <style>
                                  @page {
                                    size: A4;
                                    margin: 0.5cm;
                                  }
                                  * {
                                    margin: 0;
                                    padding: 0;
                                    box-sizing: border-box;
                                  }
                                  body {
                                    font-family: Arial, 'Segoe UI', Tahoma, sans-serif;
                                    background: white;
                                    padding: 20px;
                                    color: #111827;
                                    line-height: 1.5;
                                  }
                                  .border-2 {
                                    border-width: 2px;
                                  }
                                  .border-gray-800 {
                                    border-color: #1f2937;
                                  }
                                  .border-gray-400 {
                                    border-color: #9ca3af;
                                  }
                                  .border-gray-900 {
                                    border-color: #111827;
                                  }
                                  .border {
                                    border-style: solid;
                                    border-width: 1px;
                                  }
                                  .rounded-lg {
                                    border-radius: 0.5rem;
                                  }
                                  .p-6 {
                                    padding: 1.5rem;
                                  }
                                  .p-8 {
                                    padding: 2rem;
                                  }
                                  .mb-6 {
                                    margin-bottom: 1.5rem;
                                  }
                                  .mb-4 {
                                    margin-bottom: 1rem;
                                  }
                                  .mb-3 {
                                    margin-bottom: 0.75rem;
                                  }
                                  .mb-2 {
                                    margin-bottom: 0.5rem;
                                  }
                                  .mb-1 {
                                    margin-bottom: 0.25rem;
                                  }
                                  .mt-6 {
                                    margin-top: 1.5rem;
                                  }
                                  .mt-4 {
                                    margin-top: 1rem;
                                  }
                                  .mt-1 {
                                    margin-top: 0.25rem;
                                  }
                                  .pt-4 {
                                    padding-top: 1rem;
                                  }
                                  .text-center {
                                    text-align: center;
                                  }
                                  .text-right {
                                    text-align: right;
                                  }
                                  .text-3xl {
                                    font-size: 1.875rem;
                                    line-height: 2.25rem;
                                  }
                                  .text-lg {
                                    font-size: 1.125rem;
                                    line-height: 1.75rem;
                                  }
                                  .text-sm {
                                    font-size: 0.875rem;
                                    line-height: 1.25rem;
                                  }
                                  .font-bold {
                                    font-weight: 700;
                                  }
                                  .font-semibold {
                                    font-weight: 600;
                                  }
                                  .text-gray-900 {
                                    color: #111827;
                                  }
                                  .bg-gray-100 {
                                    background-color: #f3f4f6;
                                  }
                                  .grid {
                                    display: grid;
                                  }
                                  .grid-cols-2 {
                                    grid-template-columns: repeat(2, minmax(0, 1fr));
                                  }
                                  .grid-cols-3 {
                                    grid-template-columns: repeat(3, minmax(0, 1fr));
                                  }
                                  .gap-8 {
                                    gap: 2rem;
                                  }
                                  .gap-4 {
                                    gap: 1rem;
                                  }
                                  .flex {
                                    display: flex;
                                  }
                                  .justify-start {
                                    justify-content: flex-start;
                                  }
                                  .items-center {
                                    align-items: center;
                                  }
                                  .w-full {
                                    width: 100%;
                                  }
                                  .border-collapse {
                                    border-collapse: collapse;
                                  }
                                  table {
                                    width: 100%;
                                    border-collapse: collapse;
                                  }
                                  th, td {
                                    padding: 0.5rem;
                                    text-align: center;
                                    border: 1px solid #9ca3af;
                                  }
                                  th {
                                    background-color: #f3f4f6;
                                    font-weight: 600;
                                    border-color: #1f2937;
                                  }
                                  .min-h-\\[20px\\] {
                                    min-height: 20px;
                                  }
                                  .min-h-\\[30px\\] {
                                    min-height: 30px;
                                  }
                                  .min-h-\\[50px\\] {
                                    min-height: 50px;
                                  }
                                  .min-w-\\[150px\\] {
                                    min-width: 150px;
                                  }
                                  .min-w-\\[200px\\] {
                                    min-width: 200px;
                                  }
                                  .border-b {
                                    border-bottom-width: 1px;
                                  }
                                  .border-b-2 {
                                    border-bottom-width: 2px;
                                  }
                                  .border-t {
                                    border-top-width: 1px;
                                  }
                                  .inline-block {
                                    display: inline-block;
                                  }
                                  .ml-2 {
                                    margin-left: 0.5rem;
                                  }
                                  .mr-2 {
                                    margin-right: 0.5rem;
                                  }
                                  .pl-2 {
                                    padding-left: 0.5rem;
                                  }
                                  .pr-2 {
                                    padding-right: 0.5rem;
                                  }
                                </style>
                              </head>
                              <body>
                                ${invoiceHTML}
                              </body>
                            </html>
                          `);
                          
                          printWindow.document.close();
                          
                          // Wait for content to load then print
                          setTimeout(() => {
                            printWindow.print();
                            // Close window after printing
                            setTimeout(() => {
                              printWindow.close();
                            }, 500);
                          }, 250);
                        }}
                        className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200"
                      >
                        طباعة
                      </button>
                      <button 
                        onClick={() => setShowInvoiceModal(false)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 print:p-6">
                  <div className="border-2 border-gray-800 rounded-lg p-6 print:border-black">
                    {/* Invoice Header - Arabic Only */}
                    <div className="text-center mb-6">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">فاتورة</h1>
                      <div className="flex justify-start items-center mt-4">
                        <span className="text-lg font-semibold text-gray-900">رقم الفاتورة:</span>
                        <span className="ml-2 text-lg text-gray-900 border-b-2 border-gray-900 min-w-[200px] inline-block text-right pr-2">
                          {selectedSale.invoice_number}
                        </span>
                      </div>
                    </div>
                    
                    {/* Customer Information - Arabic Only */}
                    <div className="grid grid-cols-2 gap-8 mb-6">
                      <div>
                        <div className="mb-3">
                          <span className="text-sm font-semibold text-gray-900">بإسم السيد(ة):</span>
                          <div className="mt-1 border-b border-gray-400 min-h-[20px]">
                            <span className="text-gray-900">{selectedSale.client_name}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-900">العنوان:</span>
                          <div className="mt-1 border-b border-gray-400 min-h-[20px]">
                            <span className="text-gray-900">{clientAddress}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mb-3">
                          <span className="text-sm font-semibold text-gray-900">المعرف الجبائي:</span>
                          <div className="mt-1 border-b border-gray-400 min-h-[20px]">
                            <span className="text-gray-900">{taxId}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Items Table - Arabic Only */}
                    <div className="mb-6">
                      <table className="w-full border-collapse border border-gray-800">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-800 p-2 text-center text-sm font-semibold text-gray-900">
                              الكمية
                            </th>
                            <th className="border border-gray-800 p-2 text-center text-sm font-semibold text-gray-900">
                              نوعية البضاعة
                            </th>
                            <th className="border border-gray-800 p-2 text-center text-sm font-semibold text-gray-900">
                              السعر الجملي
                            </th>
                            <th className="border border-gray-800 p-2 text-center text-sm font-semibold text-gray-900">
                              السعر الفردي
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSale.items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-400">
                              <td className="border border-gray-400 p-2 text-center text-gray-900">
                                {item.quantity}
                              </td>
                              <td className="border border-gray-400 p-2 text-center text-gray-900">
                                {getProductTypeLabel(item.product_type)}
                              </td>
                              <td className="border border-gray-400 p-2 text-center text-gray-900">
                                {formatCurrencyTND(item.total_price)}
                              </td>
                              <td className="border border-gray-400 p-2 text-center text-gray-900">
                                {formatCurrencyTND(item.unit_price)}
                              </td>
                            </tr>
                          ))}
                          {/* Empty rows to match template */}
                          {Array.from({ length: Math.max(0, 10 - selectedSale.items.length) }).map((_, index) => (
                            <tr key={`empty-${index}`} className="border-b border-gray-400">
                              <td className="border border-gray-400 p-2 text-center text-gray-400 min-h-[30px]">&nbsp;</td>
                              <td className="border border-gray-400 p-2 text-center text-gray-400">&nbsp;</td>
                              <td className="border border-gray-400 p-2 text-center text-gray-400">&nbsp;</td>
                              <td className="border border-gray-400 p-2 text-center text-gray-400">&nbsp;</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Bottom Section - Arabic Only */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-2 text-right">الإمضاء والطابع</div>
                        <div className="border-b border-gray-400 min-h-[50px]"></div>
                      </div>
                      <div className="border-2 border-gray-800 p-3 text-center">
                        <div className="text-sm font-semibold text-gray-900 mb-1">الصافي للدفع</div>
                        <div className="text-lg font-bold text-gray-900 border-b border-gray-400 min-h-[30px] pt-1">
                          {formatCurrencyTND(selectedSale.total_amount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900 mb-2">التاريخ</div>
                        <div className="border-b border-gray-400 min-h-[20px]">
                          <span className="text-gray-900">{invoiceDate}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Final Statement - Arabic Only */}
                    <div className="mt-6 pt-4 border-t border-gray-400">
                      <div className="text-sm text-gray-900 text-right">
                        <span className="font-semibold">أوقفت هذه الفاتورة بمبلغ قدره :</span>
                        <span className="mr-2 border-b-2 border-gray-900 min-w-[150px] inline-block text-right pr-2">
                          {formatCurrencyTND(selectedSale.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end print:hidden">
                  <button
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200"
                    onClick={() => setShowInvoiceModal(false)}
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default SalesManagement;