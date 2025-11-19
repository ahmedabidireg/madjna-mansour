import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Bird, X, AlertTriangle, HeartPulse, Info, Syringe, Activity, TrendingUp, CheckCircle } from 'lucide-react';
import { Chicken, Vaccination, HealthEvent } from '../types';
import { databaseService } from '../services/database';
import { usePermissions } from '../hooks/usePermissions';
import Pagination from '../components/common/Pagination';

const ChickenManagement: React.FC = () => {
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const [chickens, setChickens] = useState<Chicken[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedChicken, setSelectedChicken] = useState<Chicken | null>(null);
  const [formData, setFormData] = useState<Partial<Chicken>>({
    batch_number: '',
    count: 0,
    age_weeks: 0,
    breed: '',
    status: 'alive',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: 0,
    notes: ''
  });

  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsChicken, setDetailsChicken] = useState<Chicken | null>(null);

  // Health/Vaccination modals inside details modal
  const [showHealthEventModal, setShowHealthEventModal] = useState(false);
  const [showVaccinationModal, setShowVaccinationModal] = useState(false);
  const [showBatchHealthModal, setShowBatchHealthModal] = useState(false);
  const [healthPage, setHealthPage] = useState(1);
  const [healthPageSize] = useState(5);
  const [healthEventData, setHealthEventData] = useState<Partial<HealthEvent>>({
    chicken_id: '',
    event_type: 'illness',
    date: new Date().toISOString().split('T')[0],
    description: '',
    notes: ''
  });
  const [batchHealthData, setBatchHealthData] = useState<{
    event_type: 'illness' | 'death' | 'recovery';
    count: number;
    date: string;
    notes?: string;
  }>({
    event_type: 'illness',
    count: 1,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [vaccinationData, setVaccinationData] = useState<Partial<Vaccination>>({
    chicken_batch: '',
    vaccine_name: '',
    date: new Date().toISOString().split('T')[0],
    next_due_date: '',
    administered_by: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const chickensData = await databaseService.getChickens();
      const [vaccinationsData, healthEventsData] = await Promise.all([
        databaseService.getVaccinations(),
        databaseService.getHealthEventsForChickens(chickensData.map(c => c.id))
      ]);
      setChickens(chickensData);
      setVaccinations(vaccinationsData);
      setHealthEvents(healthEventsData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChicken = async () => {
    try {
      await databaseService.addChicken({
        ...formData,
        status: 'alive',
      } as Omit<Chicken, 'id'>);
      setShowAddModal(false);
      setFormData({
        batch_number: '',
        count: 0,
        age_weeks: 0,
        breed: '',
        status: 'alive',
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_price: 0,
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('خطأ في إضافة الدجاج:', error);
    }
  };

  const handleEditChicken = async () => {
    if (!selectedChicken) return;
    try {
      await databaseService.updateChicken(selectedChicken.id, {
        ...formData,
        status: 'alive',
      });
      setShowEditModal(false);
      setSelectedChicken(null);
      loadData();
    } catch (error) {
      console.error('خطأ في تعديل الدجاج:', error);
    }
  };

  const handleDeleteChicken = async () => {
    if (!selectedChicken) return;
    try {
      await databaseService.deleteChicken(selectedChicken.id);
      setShowDeleteModal(false);
      setSelectedChicken(null);
      loadData();
    } catch (error) {
      console.error('خطأ في حذف الدجاج:', error);
    }
  };

  const handleAddHealthEvent = async () => {
    try {
      if (!healthEventData.chicken_id || !healthEventData.event_type || !healthEventData.description || !healthEventData.date) return;
      await databaseService.addHealthEvent({
        chicken_id: healthEventData.chicken_id,
        event_type: healthEventData.event_type,
        date: healthEventData.date,
        description: healthEventData.description,
        medication: healthEventData.medication,
        dosage: healthEventData.dosage,
        veterinarian: healthEventData.veterinarian,
        cost: healthEventData.cost,
        notes: healthEventData.notes
      } as Omit<HealthEvent, 'id'>);
      setShowHealthEventModal(false);
      setHealthEventData({
        chicken_id: detailsChicken?.id || '',
        event_type: 'illness',
        date: new Date().toISOString().split('T')[0],
        description: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('خطأ في إضافة حدث صحي:', error);
    }
  };

  const handleAddVaccination = async () => {
    try {
      await databaseService.addVaccination(vaccinationData as Omit<Vaccination, 'id'>);
      setShowVaccinationModal(false);
      setVaccinationData({
        chicken_batch: detailsChicken?.batch_number || '',
        vaccine_name: '',
        date: new Date().toISOString().split('T')[0],
        next_due_date: '',
        administered_by: ''
      });
      loadData();
    } catch (error) {
      console.error('خطأ في إضافة التلقيح:', error);
    }
  };

  const openEditModal = (chicken: Chicken) => {
    setSelectedChicken(chicken);
    setFormData({
      batch_number: chicken.batch_number,
      count: chicken.count,
      age_weeks: chicken.age_weeks,
      breed: chicken.breed,
      status: 'alive',
      purchase_date: chicken.purchase_date,
      purchase_price: chicken.purchase_price,
      notes: chicken.notes || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (chicken: Chicken) => {
    setSelectedChicken(chicken);
    setShowDeleteModal(true);
  };

  const openDetailsModal = (chicken: Chicken) => {
    setDetailsChicken(chicken);
    setShowDetailsModal(true);
    setShowHealthEventModal(false);
    setShowVaccinationModal(false);
    setHealthPage(1);
    setHealthEventData({
      chicken_id: chicken.id,
      event_type: 'illness',
      date: new Date().toISOString().split('T')[0],
      description: '',
      notes: ''
    });
    setVaccinationData({
      chicken_batch: chicken.batch_number,
      vaccine_name: '',
      date: new Date().toISOString().split('T')[0],
      next_due_date: '',
      administered_by: ''
    });
  };

  // Calculate stats based on health events
  const getEventCountValue = (event: HealthEvent): number => {
    // Try to extract count from description like "العدد: 3" or any digits
    if (event.description) {
      const match = event.description.match(/العدد\s*:\s*(\d+)/);
      if (match && match[1]) {
        const n = parseInt(match[1], 10);
        if (!Number.isNaN(n) && n > 0) return n;
      }
      const anyNumber = event.description.match(/(\d+)/);
      if (anyNumber && anyNumber[1]) {
        const n = parseInt(anyNumber[1], 10);
        if (!Number.isNaN(n) && n > 0) return n;
      }
    }
    return 1;
  };
  const getChickenHealthEventCount = (chickenId: string, eventType: HealthEvent['event_type']) =>
    healthEvents
      .filter(ev => ev.chicken_id === chickenId && ev.event_type === eventType)
      .reduce((sum, ev) => sum + getEventCountValue(ev), 0);

  // Get current sick chickens for a batch (illness - recovery)
  const getChickenCurrentSickCount = (chickenId: string) => {
    const totalSick = getChickenHealthEventCount(chickenId, 'illness');
    const totalRecovered = getChickenHealthEventCount(chickenId, 'recovery');
    return Math.max(totalSick - totalRecovered, 0);
  };

  const totalChickens = chickens.reduce((sum, batch) => sum + batch.count, 0);
  const totalSick = healthEvents.filter(ev => ev.event_type === 'illness').reduce((s, ev) => s + getEventCountValue(ev), 0);
  const totalRecovered = healthEvents.filter(ev => ev.event_type === 'recovery').reduce((s, ev) => s + getEventCountValue(ev), 0);
  const sickChickens = Math.max(totalSick - totalRecovered, 0); // المرض - التعافي = المرض الحالي
  const deadChickens = healthEvents.filter(ev => ev.event_type === 'death').reduce((s, ev) => s + getEventCountValue(ev), 0);
  const aliveChickens = Math.max(totalChickens - deadChickens, 0);

  const sortedChickens = useMemo(() => {
    return [...chickens].sort((a, b) => {
      const dateA = new Date(a.purchase_date).getTime();
      const dateB = new Date(b.purchase_date).getTime();
      if (dateA === dateB) {
        return (b.id || '').localeCompare(a.id || '');
      }
      return dateB - dateA;
    });
  }, [chickens]);

  // Pagination
  const totalPages = Math.ceil(chickens.length / itemsPerPage);
  const paginatedChickens = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedChickens.slice(startIndex, endIndex);
  }, [sortedChickens, currentPage, itemsPerPage]);

  // Check read permission
  if (!canRead('chickens')) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد صلاحية</h3>
          <p className="text-gray-600">ليس لديك صلاحية لعرض الدجاج</p>
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
                <Bird className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">
                  إدارة الدجاج
                </h1>
                <p className="text-gray-600 mt-1">متابعة الدفعات والحالة الصحية بشكل متقدم</p>
              </div>
            </div>
            {canCreate('chickens') && (
              <button 
                className="bg-slate-600 hover:bg-slate-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 rtl:space-x-reverse transition-colors duration-200 text-sm sm:text-base"
                onClick={() => setShowAddModal(true)}
                title="إضافة دفعة جديدة"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">إضافة دفعة جديدة</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">إجمالي الدجاج</p>
                <p className="text-2xl font-semibold text-slate-800">{totalChickens}</p>
                <p className="text-xs text-slate-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  إجمالي الثروة
                </p>
              </div>
              <div className="bg-slate-100 p-3 rounded-md">
                <Bird className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">الدجاج الحي</p>
                <p className="text-2xl font-semibold text-slate-800">{aliveChickens}</p>
                <p className="text-xs text-emerald-600 mt-1 flex items-center">
                  <Activity className="h-3 w-3 mr-1" />
                  صحة جيدة
                </p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-md">
                <Bird className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">الدجاج المريض</p>
                <p className="text-2xl font-semibold text-slate-800">{sickChickens}</p>
                <p className="text-xs text-amber-600 mt-1 flex items-center">
                  <HeartPulse className="h-3 w-3 mr-1" />
                  يحتاج رعاية
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-md">
                <HeartPulse className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">الدجاج الميت</p>
                <p className="text-2xl font-semibold text-slate-800">{deadChickens}</p>
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  خسائر مسجلة
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-md">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-600 p-6">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Bird className="h-5 w-5 text-white" />
              <h3 className="text-lg font-semibold text-white">دفعات الدجاج</h3>
            </div>
          </div>
          
          {chickens.length === 0 ? (
            <div className="p-12 text-center">
              <Bird className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد دفعات دجاج</h3>
              <p className="text-gray-500 mb-6">ابدأ بإضافة أول دفعة دجاج لمزرعتك</p>
              <button 
                className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg flex items-center space-x-3 rtl:space-x-reverse mx-auto transition-colors duration-200"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4" />
                <span>إضافة دفعة جديدة</span>
              </button>
            </div>
          ) : (
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      رقم الدفعة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العدد
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العمر (أسابيع)
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      النوع
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      مريض
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ميت
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
                  {paginatedChickens.map((chicken, index) => (
                    <tr key={chicken.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-slate-100 p-2 rounded-md mr-3">
                            <Bird className="h-4 w-4 text-slate-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{chicken.batch_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {chicken.count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {chicken.age_weeks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {chicken.breed}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getChickenCurrentSickCount(chicken.id) > 0 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {getChickenCurrentSickCount(chicken.id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getChickenHealthEventCount(chicken.id, 'death') > 0 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {getChickenHealthEventCount(chicken.id, 'death')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(chicken.purchase_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          {canUpdate('chickens') && (
                            <button 
                              className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50 transition-colors duration-200"
                              onClick={() => openEditModal(chicken)}
                              title="تعديل بيانات الدفعة"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete('chickens') && (
                            <button 
                              className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-50 transition-colors duration-200"
                              onClick={() => openDeleteModal(chicken)}
                              title="حذف الدفعة"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          {canRead('chickens') && (
                            <button
                              className="text-gray-600 hover:text-gray-800 p-1.5 rounded-md hover:bg-gray-50 transition-colors duration-200"
                              onClick={() => openDetailsModal(chicken)}
                              title="تفاصيل الدفعة"
                            >
                              <Info className="h-4 w-4" />
                            </button>
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
            {paginatedChickens.map((chicken) => {
              const sickCount = getChickenCurrentSickCount(chicken.id);
              const deadCount = getChickenHealthEventCount(chicken.id, 'death');
              
              return (
                <div key={chicken.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse flex-1">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <Bird className="h-5 w-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800 truncate">
                          {chicken.batch_number}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{chicken.breed}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {canRead('chickens') && (
                        <button
                          onClick={() => openDetailsModal(chicken)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="التفاصيل"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      )}
                      {canUpdate('chickens') && (
                        <button
                          onClick={() => openEditModal(chicken)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete('chickens') && (
                        <button
                          onClick={() => openDeleteModal(chicken)}
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
                      <span className="text-xs text-gray-600">العدد:</span>
                      <span className="text-sm font-semibold text-gray-900">{chicken.count}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">العمر:</span>
                      <span className="text-sm text-gray-900">{chicken.age_weeks} أسبوع</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">تاريخ الشراء:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(chicken.purchase_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    {(sickCount > 0 || deadCount > 0) && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-600">الحالة:</span>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          {sickCount > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              {sickCount} مريض
                            </span>
                          )}
                          {deadCount > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              {deadCount} ميت
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {chickens.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={chickens.length}
            />
          )}
        </div>

        {/* Batch Details Modal */}
        {showDetailsModal && detailsChicken && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg">
              <div className="bg-slate-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Bird className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">تفاصيل الدفعة: {detailsChicken.batch_number}</h3>
                  </div>
                  <button 
                    onClick={() => setShowDetailsModal(false)}
                    className="p-1 hover:bg-slate-500 rounded-md transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Batch Info */}
                <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
                  <h4 className="font-semibold text-lg mb-4 text-gray-800">معلومات الدفعة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <span className="font-medium text-gray-700">العدد:</span>
                      <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-800 font-medium">{detailsChicken.count}</span>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <span className="font-medium text-gray-700">العمر (أسابيع):</span>
                      <span className="bg-emerald-100 px-2 py-1 rounded-md text-emerald-800 font-medium">{detailsChicken.age_weeks}</span>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <span className="font-medium text-gray-700">النوع:</span>
                      <span className="bg-purple-100 px-2 py-1 rounded-md text-purple-800 font-medium">{detailsChicken.breed}</span>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <span className="font-medium text-gray-700">تاريخ الدخول:</span>
                      <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-800 font-medium">
                        {new Date(detailsChicken.purchase_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">ملاحظات:</span>
                      <p className="mt-1 text-gray-600 bg-white p-3 rounded-md border border-gray-300">{detailsChicken.notes || 'لا توجد ملاحظات'}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-6 flex-wrap">
                  <button
                    className="flex items-center text-white bg-amber-600 hover:bg-amber-700 text-sm border border-amber-500 rounded-md px-3 py-2 transition-colors duration-200"
                    onClick={() => {
                      setBatchHealthData({
                        event_type: 'illness',
                        count: 1,
                        date: new Date().toISOString().split('T')[0],
                        notes: ''
                      });
                      setShowBatchHealthModal(true);
                    }}
                  >
                    <HeartPulse className="h-4 w-4 mr-2" />
                    تسجيل مريض
                  </button>
                  <button
                    className="flex items-center text-white bg-emerald-600 hover:bg-emerald-700 text-sm border border-emerald-500 rounded-md px-3 py-2 transition-colors duration-200"
                    onClick={() => {
                      setBatchHealthData({
                        event_type: 'recovery',
                        count: 1,
                        date: new Date().toISOString().split('T')[0],
                        notes: ''
                      });
                      setShowBatchHealthModal(true);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    تسجيل تعافي
                  </button>
                  <button
                    className="flex items-center text-white bg-red-600 hover:bg-red-700 text-sm border border-red-500 rounded-md px-3 py-2 transition-colors duration-200"
                    onClick={() => {
                      setBatchHealthData({
                        event_type: 'death',
                        count: 1,
                        date: new Date().toISOString().split('T')[0],
                        notes: ''
                      });
                      setShowBatchHealthModal(true);
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    تسجيل وفاة
                  </button>
                  <button
                    className="flex items-center text-white bg-blue-600 hover:bg-blue-700 text-sm border border-blue-500 rounded-md px-3 py-2 transition-colors duration-200"
                    onClick={() => {
                      setShowVaccinationModal(true);
                      setVaccinationData({
                        chicken_batch: detailsChicken.batch_number,
                        vaccine_name: '',
                        date: new Date().toISOString().split('T')[0],
                        next_due_date: '',
                        administered_by: ''
                      });
                    }}
                  >
                    <Syringe className="h-4 w-4 mr-2" />
                    إضافة تلقيح
                  </button>
                </div>

                {/* Health Events Table */}
                <div className="bg-amber-50 p-6 rounded-md border border-amber-200">
                  <h4 className="font-semibold text-lg mb-4 text-amber-900 flex items-center">
                    <HeartPulse className="h-5 w-5 mr-2" />
                    سجل الحالات الصحية
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع الحالة</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العدد</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوصف</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {healthEvents.filter(ev => ev.chicken_id === detailsChicken.id).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-8 text-gray-500">
                              <HeartPulse className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              لا يوجد حالات صحية مسجلة لهذه الدفعة
                            </td>
                          </tr>
                        ) : (
                          (() => {
                            const filtered = healthEvents.filter(ev => ev.chicken_id === detailsChicken.id);
                            const totalPages = Math.max(1, Math.ceil(filtered.length / healthPageSize));
                            const safePage = Math.min(Math.max(1, healthPage), totalPages);
                            const start = (safePage - 1) * healthPageSize;
                            const pageItems = filtered.slice(start, start + healthPageSize);
                            return pageItems.map((event) => (
                              <tr key={event.id} className="hover:bg-amber-50">
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    event.event_type === 'death' ? 'bg-red-100 text-red-800' : 
                                    event.event_type === 'recovery' ? 'bg-emerald-100 text-emerald-800' : 
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {event.event_type === 'death' ? 'وفاة' : 
                                     event.event_type === 'recovery' ? 'تعافي' : 
                                     'مرض'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-medium text-gray-900">{getEventCountValue(event)}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {new Date(event.date).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {event.description}
                                </td>
                                <td className="px-4 py-3 text-gray-600">{event.notes || '-'}</td>
                              </tr>
                            ));
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination controls */}
                  {healthEvents.filter(ev => ev.chicken_id === detailsChicken.id).length > healthPageSize && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-600">
                        {(() => {
                          const total = healthEvents.filter(ev => ev.chicken_id === detailsChicken.id).length;
                          const totalPages = Math.max(1, Math.ceil(total / healthPageSize));
                          const safePage = Math.min(Math.max(1, healthPage), totalPages);
                          return `الصفحة ${safePage} من ${totalPages}`;
                        })()}
                      </div>
                      <div className="space-x-2 rtl:space-x-reverse">
                        <button
                          className="px-3 py-1.5 border rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          onClick={() => setHealthPage(p => Math.max(1, p - 1))}
                          disabled={healthPage <= 1}
                        >
                          السابق
                        </button>
                        <button
                          className="px-3 py-1.5 border rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          onClick={() => {
                            const total = healthEvents.filter(ev => ev.chicken_id === detailsChicken.id).length;
                            const totalPages = Math.max(1, Math.ceil(total / healthPageSize));
                            setHealthPage(p => Math.min(totalPages, p + 1));
                          }}
                          disabled={(() => {
                            const total = healthEvents.filter(ev => ev.chicken_id === detailsChicken.id).length;
                            const totalPages = Math.max(1, Math.ceil(total / healthPageSize));
                            return healthPage >= totalPages;
                          })()}
                        >
                          التالي
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vaccinations Table */}
                <div className="bg-emerald-50 p-6 rounded-md border border-emerald-200">
                  <h4 className="font-semibold text-lg mb-4 text-emerald-900 flex items-center">
                    <Syringe className="h-5 w-5 mr-2" />
                    سجل التلقيحات
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع اللقاح</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ التلقيح</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الجرعة القادمة</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الطبيب المسؤول</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {vaccinations.filter(v => v.chicken_batch === detailsChicken.batch_number).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-8 text-gray-500">
                              <Syringe className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              لا يوجد تلقيحات مسجلة لهذه الدفعة
                            </td>
                          </tr>
                        ) : (
                          vaccinations
                            .filter(v => v.chicken_batch === detailsChicken.batch_number)
                            .map((vaccination) => (
                              <tr key={vaccination.id} className="hover:bg-emerald-50">
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                    {vaccination.vaccine_name}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-700 font-medium">
                                  {new Date(vaccination.date).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {vaccination.next_due_date ? new Date(vaccination.next_due_date).toLocaleDateString('fr-FR') : 'غير محدد'}
                                </td>
                                <td className="px-4 py-3 text-gray-700 font-medium">{vaccination.administered_by}</td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end">
                <button
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium"
                  onClick={() => setShowDetailsModal(false)}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Batch Health Event Modal */}
        {showBatchHealthModal && detailsChicken && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
              <div className={
                batchHealthData.event_type === 'death' ? 'bg-red-600 p-6 rounded-t-lg' : 
                batchHealthData.event_type === 'recovery' ? 'bg-emerald-600 p-6 rounded-t-lg' : 
                'bg-amber-600 p-6 rounded-t-lg'
              }>
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {batchHealthData.event_type === 'death' ? <AlertTriangle className="h-5 w-5" /> : 
                     batchHealthData.event_type === 'recovery' ? <CheckCircle className="h-5 w-5" /> : 
                     <HeartPulse className="h-5 w-5" />}
                    <h3 className="text-lg font-semibold">
                      {batchHealthData.event_type === 'death' ? 'تسجيل وفاة' : 
                       batchHealthData.event_type === 'recovery' ? 'تسجيل تعافي' : 
                       'تسجيل حالة مرض'}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setShowBatchHealthModal(false)}
                    className="p-1 hover:bg-white/20 rounded-md transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-white/80 mt-1">دفعة: {detailsChicken.batch_number}</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">النوع</label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors duration-200"
                    value={batchHealthData.event_type}
                    onChange={e => setBatchHealthData({...batchHealthData, event_type: e.target.value as 'illness' | 'death' | 'recovery'})}
                  >
                    <option value="illness">مريض</option>
                    <option value="recovery">تعافي</option>
                    <option value="death">ميت</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">عدد الدجاج</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors duration-200"
                    value={batchHealthData.count}
                    min={1}
                    onChange={e => setBatchHealthData({...batchHealthData, count: Math.max(1, parseInt(e.target.value) || 1)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الحالة</label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors duration-200"
                    value={batchHealthData.date}
                    onChange={e => setBatchHealthData({...batchHealthData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات (اختياري)</label>
                  <textarea
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors duration-200"
                    rows={3}
                    value={batchHealthData.notes}
                    onChange={e => setBatchHealthData({...batchHealthData, notes: e.target.value})}
                    placeholder="أدخل أي ملاحظات إضافية..."
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-3 py-1.5 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setShowBatchHealthModal(false)}
                >
                  إلغاء
                </button>
                <button
                  className={`px-3 py-1.5 text-white rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    batchHealthData.event_type === 'death' ? 'bg-red-600 hover:bg-red-700' : 
                    batchHealthData.event_type === 'recovery' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                    'bg-amber-600 hover:bg-amber-700'
                  }`}
                  onClick={async () => {
                    try {
                      // Create a single entry containing the total count in the description
                      const descBase = batchHealthData.event_type === 'death' ? 'تسجيل وفاة' : 
                                      batchHealthData.event_type === 'recovery' ? 'تسجيل تعافي' : 
                                      'تسجيل حالة مرض';
                      const eventPayload = {
                        chicken_id: detailsChicken.id,
                        event_type: batchHealthData.event_type,
                        date: batchHealthData.date,
                        description: `${descBase} - العدد: ${Math.max(1, batchHealthData.count)}`,
                        notes: batchHealthData.notes || ''
                      };
                      await databaseService.addHealthEvent(eventPayload as Omit<HealthEvent, 'id'>);
                      setShowBatchHealthModal(false);
                      await loadData();
                    } catch (e) {
                      console.error('فشل تسجيل الحالة:', e);
                    }
                  }}
                  disabled={!batchHealthData.date || !batchHealthData.count}
                >
                  تأكيد التسجيل
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Health Event Modal removed as requested */}

        {/* Vaccination Modal */}
        {showVaccinationModal && detailsChicken && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
              <div className="bg-emerald-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Syringe className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">إضافة تلقيح</h3>
                  </div>
                  <button 
                    onClick={() => setShowVaccinationModal(false)}
                    className="p-1 hover:bg-emerald-500 rounded-md transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-emerald-100 mt-1">للدفعة: {detailsChicken.batch_number}</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع اللقاح</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200"
                    value={vaccinationData.vaccine_name}
                    onChange={e => setVaccinationData({...vaccinationData, vaccine_name: e.target.value})}
                    placeholder="أدخل اسم اللقاح..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ التلقيح</label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200"
                    value={vaccinationData.date}
                    onChange={e => setVaccinationData({...vaccinationData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">موعد الجرعة القادمة</label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200"
                    value={vaccinationData.next_due_date}
                    onChange={e => setVaccinationData({...vaccinationData, next_due_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الطبيب المسؤول</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200"
                    value={vaccinationData.administered_by}
                    onChange={e => setVaccinationData({...vaccinationData, administered_by: e.target.value})}
                    placeholder="أدخل اسم الطبيب..."
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-3 py-1.5 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setShowVaccinationModal(false)}
                >
                  إلغاء
                </button>
                <button
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAddVaccination}
                  disabled={!vaccinationData.vaccine_name || !vaccinationData.date}
                >
                  إضافة التلقيح
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Chicken Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
              <div className="bg-slate-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Plus className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">إضافة دفعة جديدة</h3>
                  </div>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="p-1 hover:bg-slate-500 rounded-md transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الدفعة</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.batch_number}
                    onChange={e => setFormData({...formData, batch_number: e.target.value})}
                    placeholder="أدخل رقم الدفعة..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">عدد الدجاج</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.count}
                    min={1}
                    onChange={e => setFormData({...formData, count: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العمر (أسابيع)</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.age_weeks}
                    min={0}
                    onChange={e => setFormData({...formData, age_weeks: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">النوع</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.breed}
                    onChange={e => setFormData({...formData, breed: e.target.value})}
                    placeholder="أدخل نوع الدجاج..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الدخول</label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.purchase_date}
                    onChange={e => setFormData({...formData, purchase_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">سعر الشراء</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.purchase_price ?? 0}
                    min={0}
                    step="0.01"
                    onChange={e => setFormData({...formData, purchase_price: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                  <textarea
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    rows={3}
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="أدخل أي ملاحظات إضافية..."
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-3 py-1.5 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setShowAddModal(false)}
                >
                  إلغاء
                </button>
                <button
                  className="px-3 py-1.5 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAddChicken}
                  disabled={!formData.batch_number || !formData.count || !formData.breed || !formData.purchase_date || formData.purchase_price === undefined}
                >
                  إضافة الدفعة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Chicken Modal */}
        {showEditModal && selectedChicken && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
              <div className="bg-slate-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Edit className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">تعديل الدفعة</h3>
                  </div>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="p-1 hover:bg-slate-500 rounded-md transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-slate-100 mt-1">رقم الدفعة: {selectedChicken.batch_number}</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الدفعة</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.batch_number}
                    onChange={e => setFormData({...formData, batch_number: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">عدد الدجاج</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.count}
                    min={1}
                    onChange={e => setFormData({...formData, count: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العمر (أسابيع)</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.age_weeks}
                    min={0}
                    onChange={e => setFormData({...formData, age_weeks: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">النوع</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.breed}
                    onChange={e => setFormData({...formData, breed: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الدخول</label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.purchase_date}
                    onChange={e => setFormData({...formData, purchase_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">سعر الشراء</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    value={formData.purchase_price ?? 0}
                    min={0}
                    step="0.01"
                    onChange={e => setFormData({...formData, purchase_price: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                  <textarea
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors duration-200"
                    rows={3}
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-3 py-1.5 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setShowEditModal(false)}
                >
                  إلغاء
                </button>
                <button
                  className="px-3 py-1.5 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleEditChicken}
                  disabled={!formData.batch_number || !formData.count || !formData.breed || !formData.purchase_date || formData.purchase_price === undefined}
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedChicken && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
              <div className="bg-red-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Trash2 className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">حذف الدفعة</h3>
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
                  الدفعة: <span className="font-semibold">{selectedChicken.batch_number}</span>
                  <br />
                  سيتم حذف جميع البيانات المرتبطة بهذه الدفعة بشكل نهائي.
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
                  onClick={handleDeleteChicken}
                >
                  نعم، احذف الدفعة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChickenManagement;