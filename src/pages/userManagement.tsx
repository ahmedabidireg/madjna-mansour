import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Users, Eye, EyeOff, UserCheck, Shield, AlertTriangle } from 'lucide-react';
import { User, UserPermission } from '../types';
import { databaseService } from '../services/database';
import { usePermissions } from '../hooks/usePermissions';
import Pagination from '../components/common/Pagination';

const UserManagement: React.FC = () => {
  const { canRead, canCreate, canUpdate, canDelete, isAdmin } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User> & { password?: string }>({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    phone: '',
    status: 'active',
    permissions: []
  });
  const [showPassword, setShowPassword] = useState(false);

  const roles = [
    { value: 'admin', label: 'مدير النظام', color: 'bg-red-100 text-red-800' },
    { value: 'manager', label: 'مدير المزرعة', color: 'bg-blue-100 text-blue-800' },
    { value: 'employee', label: 'موظف', color: 'bg-green-100 text-green-800' },
    { value: 'viewer', label: 'مشاهد', color: 'bg-gray-100 text-gray-800' }
  ];

  const modules = [
    { key: 'chickens', label: 'إدارة الدجاج' },
    { key: 'eggs', label: 'إدارة البيض' },
    { key: 'sales', label: 'إدارة المبيعات' },
    { key: 'expenses', label: 'إدارة المصروفات' },
    { key: 'cartons', label: 'إدارة الشقوف' },
    { key: 'users', label: 'إدارة المستخدمين' }
  ];

  const actions = [
    { key: 'read', label: 'عرض' },
    { key: 'create', label: 'إضافة' },
    { key: 'update', label: 'تعديل' },
    { key: 'delete', label: 'حذف' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await databaseService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      if (!formData.name || !formData.email || !formData.password) {
        alert('يرجى ملء جميع الحقول المطلوبة (الاسم، البريد الإلكتروني، وكلمة المرور)');
        return;
      }

      if (formData.password!.length < 6) {
        alert('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
        return;
      }
      
      const newUser = await databaseService.addUser({
        name: formData.name!,
        email: formData.email!,
        password: formData.password!,
        role: formData.role || 'employee',
        phone: formData.phone || '',
        status: formData.status || 'active',
        permissions: []
      });

      await loadData(); // Reload users to get the latest data
      setShowAddModal(false);
      resetForm();
      alert('تم إضافة المستخدم بنجاح');
    } catch (error: any) {
      console.error('خطأ في إضافة المستخدم:', error);
      alert(error.message || 'فشل إضافة المستخدم');
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) {
      alert('لم يتم تحديد مستخدم');
      return;
    }
    try {
      if (!formData.name || !formData.email) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
      }

      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role || selectedUser.role,
        phone: formData.phone !== undefined ? formData.phone : (selectedUser.phone || ''),
        status: formData.status || selectedUser.status || 'active'
      };

      console.log('Updating user:', { userId: selectedUser.id, updateData });
      await databaseService.updateUser(selectedUser.id, updateData);
      console.log('User updated successfully');
      
      await loadData(); // Reload users
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      alert('تم تحديث المستخدم بنجاح');
    } catch (error: any) {
      console.error('خطأ في تعديل المستخدم:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'فشل تعديل المستخدم';
      alert(errorMessage);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await databaseService.deleteUser(selectedUser.id);
      await loadData(); // Reload users
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('خطأ في حذف المستخدم:', error);
      alert(error.message || 'فشل حذف المستخدم');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) {
        alert('المستخدم غير موجود');
        return;
      }

      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      console.log('Changing user status:', { userId, currentStatus: user.status, newStatus });
      
      // Send all required fields along with status
      const updateData = {
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        status: newStatus
      };
      
      console.log('Sending update data:', updateData);
      await databaseService.updateUser(userId, updateData);
      console.log('Status updated successfully');
      await loadData(); // Reload users
    } catch (error: any) {
      console.error('خطأ في تغيير حالة المستخدم:', error);
      alert(error.message || 'فشل تغيير حالة المستخدم');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'employee',
      phone: '',
      status: 'active',
      permissions: []
    });
    setShowPassword(false);
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (dateA === dateB) {
        return (b.id || '').localeCompare(a.id || '');
      }
      return dateB - dateA;
    });
  }, [users]);

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedUsers.slice(start, end);
  }, [sortedUsers, currentPage, itemsPerPage]);
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.status === 'active').length;
  const adminUsers = users.filter(user => user.role === 'admin').length;

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status,
      permissions: user.permissions
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openPermissionsModal = (user: User) => {
    setSelectedUser(user);
    setFormData({ permissions: user.permissions || [] });
    setShowPermissionsModal(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    try {
      await databaseService.updateUser(selectedUser.id, {
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        phone: selectedUser.phone || '',
        status: selectedUser.status,
        permissions: formData.permissions || []
      });
      await loadData();
      setShowPermissionsModal(false);
      setSelectedUser(null);
      alert('تم تحديث الصلاحيات بنجاح');
    } catch (error: any) {
      console.error('خطأ في تحديث الصلاحيات:', error);
      alert(error.message || 'فشل تحديث الصلاحيات');
    }
  };

  const togglePermission = (module: string, action: string) => {
    const currentPermissions = formData.permissions || [];
    const moduleIndex = currentPermissions.findIndex((p: any) => p.module === module);
    
    if (moduleIndex === -1) {
      // Module doesn't exist, add it with this action
      setFormData({
        ...formData,
        permissions: [...currentPermissions, { module, actions: [action] }]
      });
    } else {
      // Module exists, toggle the action
      const modulePermissions = currentPermissions[moduleIndex];
      const actionIndex = modulePermissions.actions.indexOf(action);
      
      let newActions;
      if (actionIndex === -1) {
        // Add action
        newActions = [...modulePermissions.actions, action];
      } else {
        // Remove action
        newActions = modulePermissions.actions.filter((a: string) => a !== action);
      }
      
      const newPermissions = [...currentPermissions];
      if (newActions.length === 0) {
        // Remove module if no actions
        newPermissions.splice(moduleIndex, 1);
      } else {
        newPermissions[moduleIndex] = { module, actions: newActions };
      }
      
      setFormData({
        ...formData,
        permissions: newPermissions
      });
    }
  };

  const hasPermission = (module: string, action: string): boolean => {
    const currentPermissions = formData.permissions || [];
    const modulePermission = currentPermissions.find((p: any) => p.module === module);
    return modulePermission?.actions?.includes(action) || false;
  };

  const getRoleLabel = (role: string) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  const getRoleColor = (role: string) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj ? roleObj.color : 'bg-gray-100 text-gray-800';
  };

  // Check admin permission for user management
  if (!isAdmin) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد صلاحية</h3>
          <p className="text-gray-600">إدارة المستخدمين متاحة فقط للمديرين</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-base font-medium">جاري تحميل بيانات المستخدمين...</p>
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
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">
                  إدارة المستخدمين
                </h1>
                <p className="text-gray-600 mt-1">إدارة المستخدمين والصلاحيات والأنشطة</p>
              </div>
            </div>
            <button 
              className="bg-slate-600 hover:bg-slate-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 rtl:space-x-reverse transition-colors duration-200 text-sm sm:text-base"
              onClick={() => setShowAddModal(true)}
              title="إضافة مستخدم جديد"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">إضافة مستخدم جديد</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">إجمالي المستخدمين</p>
                <p className="text-2xl font-semibold text-slate-800">{totalUsers}</p>
                <p className="text-xs text-slate-600 mt-1">مستخدم مسجل</p>
              </div>
              <div className="bg-slate-100 p-3 rounded-md">
                <Users className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">المستخدمون النشطون</p>
                <p className="text-2xl font-semibold text-slate-800">{activeUsers}</p>
                <p className="text-xs text-slate-600 mt-1">مستخدم نشط</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-md">
                <UserCheck className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">المديرون</p>
                <p className="text-2xl font-semibold text-slate-800">{adminUsers}</p>
                <p className="text-xs text-slate-600 mt-1">مدير نظام</p>
              </div>
              <div className="bg-red-100 p-3 rounded-md">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>


        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-600 p-6">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Users className="h-5 w-5 text-white" />
              <h3 className="text-lg font-semibold text-white">قائمة المستخدمين</h3>
            </div>
          </div>
          
          {users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مستخدمين</h3>
              <p className="text-gray-500 mb-6">ابدأ بإضافة أول مستخدم للنظام</p>
              <button 
                className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 rtl:space-x-reverse mx-auto transition-colors duration-200"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-5 w-5" />
                <span>إضافة مستخدم جديد</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      المستخدم
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      الدور
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      آخر تسجيل دخول
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      تاريخ الإنشاء
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-lg mr-3">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.phone && (
                              <div className="text-xs text-gray-400">{user.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : user.status === 'inactive'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status === 'active' ? 'نشط' : user.status === 'inactive' ? 'غير نشط' : 'معلق'}
                          </span>
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            className={`p-1 rounded-lg transition-colors duration-200 ${
                              user.status === 'active' 
                                ? 'text-red-600 hover:bg-red-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={user.status === 'active' ? 'إلغاء التفعيل' : 'تفعيل'}
                          >
                            {user.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : 'لم يسجل دخول'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <button 
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                            onClick={() => openPermissionsModal(user)}
                            title="إدارة الصلاحيات"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors duration-200"
                            onClick={() => openEditModal(user)}
                            title="تعديل المستخدم"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                            onClick={() => openDeleteModal(user)}
                            title="حذف المستخدم"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
            {paginatedUsers.map((user) => {
              return (
                <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse flex-1">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800 truncate">
                          {user.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {canUpdate('users') && (
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete('users') && (
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => openPermissionsModal(user)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="الصلاحيات"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">الدور:</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'employee' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? 'مدير' :
                         user.role === 'manager' ? 'مدير' :
                         user.role === 'employee' ? 'موظف' : 'مشاهد'}
                      </span>
                    </div>
                    
                    {user.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">الهاتف:</span>
                        <span className="text-sm text-gray-900">{user.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">الحالة:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {users.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={users.length}
            />
          )}
        </div>

        {/* Permissions Modal */}
        {showPermissionsModal && selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="bg-slate-600 p-6 rounded-t-lg sticky top-0 z-10">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Shield className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">إدارة الصلاحيات - {selectedUser.name}</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setShowPermissionsModal(false);
                      setSelectedUser(null);
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                  >
                    <Plus className="h-5 w-5 rotate-45" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {modules.map((module) => (
                    <div key={module.key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3">{module.label}</h4>
                      <div className="space-y-2">
                        {actions.map((action) => (
                          <label key={action.key} className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                            <input
                              type="checkbox"
                              checked={hasPermission(module.key, action.key)}
                              onChange={() => togglePermission(module.key, action.key)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{action.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => {
                    setShowPermissionsModal(false);
                    setSelectedUser(null);
                  }}
                >
                  إلغاء
                </button>
                <button
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200"
                  onClick={handleSavePermissions}
                >
                  حفظ الصلاحيات
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
              <div className="bg-slate-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Users className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">إضافة مستخدم جديد</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                  >
                    <Plus className="h-5 w-5 rotate-45" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="أدخل البريد الإلكتروني"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-10 rtl:pl-10 rtl:pr-3"
                      value={formData.password || ''}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto flex items-center px-3 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                    <option value="suspended">معلق</option>
                  </select>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  إلغاء
                </button>
                <button
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAddUser}
                  disabled={!formData.name || !formData.email || !formData.password}
                >
                  إضافة المستخدم
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
              <div className="bg-slate-600 p-6 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Edit className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">تعديل المستخدم</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                  >
                    <Plus className="h-5 w-5 rotate-45" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                    <option value="suspended">معلق</option>
                  </select>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                >
                  إلغاء
                </button>
                <button
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200"
                  onClick={handleEditUser}
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
                    <h3 className="text-lg font-semibold">تأكيد الحذف</h3>
                  </div>
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                  >
                    <Plus className="h-5 w-5 rotate-45" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="text-center">
                  <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-gray-700 text-lg mb-2">هل أنت متأكد من حذف هذا المستخدم؟</p>
                  <p className="text-red-600 font-bold text-xl">
                    {selectedUser?.name}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">هذا الإجراء لا يمكن التراجع عنه</p>
                </div>
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
                  onClick={handleDeleteUser}
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

export default UserManagement;