import { useAuth } from '../contexts/AuthContext';
import { UserPermission } from '../types';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (module: string, action: 'read' | 'create' | 'update' | 'delete'): boolean => {
    // Admin has all permissions
    if (user?.role === 'admin') {
      return true;
    }

    // Check if user has the specific permission
    if (!user?.permissions || user.permissions.length === 0) {
      return false;
    }

    const modulePermission = user.permissions.find(
      (p: UserPermission) => p.module === module
    );

    if (!modulePermission) {
      return false;
    }

    return modulePermission.actions.includes(action);
  };

  const canRead = (module: string) => hasPermission(module, 'read');
  const canCreate = (module: string) => hasPermission(module, 'create');
  const canUpdate = (module: string) => hasPermission(module, 'update');
  const canDelete = (module: string) => hasPermission(module, 'delete');

  return {
    hasPermission,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    isAdmin: user?.role === 'admin'
  };
};

