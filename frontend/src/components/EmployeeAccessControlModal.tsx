import { useState, useEffect } from 'react';
import { HRPermission } from '@/types';
import { Modal } from './Modal';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/api/apiService';
import { AlertCircle, Lock, Unlock } from 'lucide-react';

interface EmployeeAccessControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
  onUpdate?: () => void;
}

export const EmployeeAccessControlModal = ({
  isOpen,
  onClose,
  employee,
  onUpdate,
}: EmployeeAccessControlModalProps) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accountLocked, setAccountLocked] = useState(!employee?.can_login);
  type PermKey = keyof Pick<HRPermission,
    'can_view_employees' | 'can_edit_employee_info' | 'can_edit_payslip' | 'can_delete_employees' | 'can_reset_password' | 'can_enable_employee_edit'>;

  const [hrPermissions, setHrPermissions] = useState<Record<PermKey, boolean>>({
    can_view_employees: false,
    can_edit_employee_info: false,
    can_edit_payslip: false,
    can_delete_employees: false,
    can_reset_password: false,
    can_enable_employee_edit: false,
  });
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // Load HR permissions when modal opens
  useEffect(() => {
    if (isOpen && employee) {
      loadHRPermissions();
    }
  }, [isOpen, employee]);

  const loadHRPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const response = await apiClient.get(`hr-permissions/?hr_employee=${employee.id}`);
      if (response.data && response.data.results?.length > 0) {
        const perms = response.data.results[0];
        setHrPermissions({
          can_view_employees: perms.can_view_employees || false,
          can_edit_employee_info: perms.can_edit_employee_info || false,
          can_edit_payslip: perms.can_edit_payslip || false,
          can_delete_employees: perms.can_delete_employees || false,
          can_reset_password: perms.can_reset_password || false,
          can_enable_employee_edit: perms.can_enable_employee_edit || false,
        });
      }
    } catch (error: any) {
      console.error('Failed to load HR permissions:', error);
      // Permissions not found is OK, just use defaults
    } finally {
      setLoadingPermissions(false);
    }
  };

  const togglePermission = (key: PermKey) => {
    setHrPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAccountLock = async (newLockedState: boolean) => {
    try {
      setIsLoading(true);
      const action = newLockedState ? 'lock' : 'unlock';
      const response = await apiClient.patch(
        `lock-unlock-account/${employee.id}/`,
        { action }
      );
      
      setAccountLocked(newLockedState);
      toast.success(response.data.message);
      onUpdate?.();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || `Failed to ${newLockedState ? 'lock' : 'unlock'} account`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePermissions = async () => {
    try {
      setIsLoading(true);
      
      // Try to update existing permissions
      const existingResponse = await apiClient.get(`hr-permissions/?hr_employee=${employee.id}`);
      
      if (existingResponse.data && existingResponse.data.results?.length > 0) {
        const permId = existingResponse.data.results[0].id;
        await apiClient.patch(`hr-permissions/${permId}/`, {
          ...hrPermissions,
        });
      } else {
        // Create new permissions
        await apiClient.post('hr-permissions/', {
          hr_employee: employee.id,
          ...hrPermissions,
        });
      }
      
      toast.success('HR Permissions saved successfully');
      onUpdate?.();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Failed to save permissions'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('Reset password for this employee? A temporary password will be generated.')) return;

    try {
      setIsLoading(true);
      const response = await apiClient.post(`reset-password/${employee.id}/`);
      
      toast.success(`Password reset successful. Temporary password: ${response.data.temporary_password}`);
      console.log('Reset password details:', response.data);
      onUpdate?.();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || 'Failed to reset password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'blacklist':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Employee Access Control" size="sm">
      <div className="p-6 space-y-6">
        {/* Employee Profile Section */}
        <div className="text-center space-y-4">
          {/* Profile Image */}
          <div className="flex justify-center">
            {employee?.profile_image_url ? (
              <img
                src={employee.profile_image_url}
                alt={employee.full_name}
                className="w-20 h-20 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white text-2xl font-bold">
                {employee?.full_name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Employee Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {employee?.full_name}
            </h3>
            <p className={`text-sm font-semibold px-3 py-1 rounded-full inline-block mt-2 ${getStatusBadgeClass(employee?.status)}`}>
              {employee?.status || 'Active'}
            </p>
          </div>

          {/* Position and Details */}
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>
              <span className="font-semibold">{employee?.position}</span>
            </p>
            <p>
              <span className="font-semibold">{employee?.role}</span>
            </p>
            <p>
              <span className="font-semibold">JTP Code: {employee?.jtp_code || 'N/A'}</span>
            </p>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Account Lock/Unlock Section */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Account Status</h4>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {accountLocked ? (
                <Lock size={20} className="text-red-600" />
              ) : (
                <Unlock size={20} className="text-green-600" />
              )}
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white block">
                  {accountLocked ? 'Account Locked' : 'Account Unlocked'}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {accountLocked ? 'Employee cannot login' : 'Employee can login'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => toggleAccountLock(!accountLocked)}
              disabled={isLoading}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              style={{
                backgroundColor: accountLocked ? '#d1d5db' : '#10b981',
              }}
            >
              <span
                className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                style={{
                  transform: accountLocked ? 'translateX(2px)' : 'translateX(22px)',
                }}
              />
            </button>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* HR Permissions Section */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">HR Permissions</h4>

          {loadingPermissions ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Loading permissions...
            </div>
          ) : (
            <>
              {/* View Employees */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <label className="text-sm text-gray-700 dark:text-gray-300">View Employees</label>
                <button
                  onClick={() => togglePermission('can_view_employees')}
                  disabled={isLoading}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  style={{
                    backgroundColor: hrPermissions.can_view_employees ? '#3b82f6' : '#d1d5db',
                  }}
                >
                  <span
                    className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                    style={{
                      transform: hrPermissions.can_view_employees ? 'translateX(22px)' : 'translateX(2px)',
                    }}
                  />
                </button>
              </div>

              {/* Edit Employees Info */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <label className="text-sm text-gray-700 dark:text-gray-300">Edit Employees Info</label>
                <button
                  onClick={() => togglePermission('can_edit_employee_info')}
                  disabled={isLoading}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  style={{
                    backgroundColor: hrPermissions.can_edit_employee_info ? '#3b82f6' : '#d1d5db',
                  }}
                >
                  <span
                    className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                    style={{
                      transform: hrPermissions.can_edit_employee_info ? 'translateX(22px)' : 'translateX(2px)',
                    }}
                  />
                </button>
              </div>

              {/* Edit Payslip */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <label className="text-sm text-gray-700 dark:text-gray-300">Edit Payslip</label>
                <button
                  onClick={() => togglePermission('can_edit_payslip')}
                  disabled={isLoading}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  style={{
                    backgroundColor: hrPermissions.can_edit_payslip ? '#3b82f6' : '#d1d5db',
                  }}
                >
                  <span
                    className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                    style={{
                      transform: hrPermissions.can_edit_payslip ? 'translateX(22px)' : 'translateX(2px)',
                    }}
                  />
                </button>
              </div>

              {/* Delete Employees */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <label className="text-sm text-gray-700 dark:text-gray-300">Delete Employees</label>
                <button
                  onClick={() => togglePermission('can_delete_employees')}
                  disabled={isLoading}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  style={{
                    backgroundColor: hrPermissions.can_delete_employees ? '#3b82f6' : '#d1d5db',
                  }}
                >
                  <span
                    className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                    style={{
                      transform: hrPermissions.can_delete_employees ? 'translateX(22px)' : 'translateX(2px)',
                    }}
                  />
                </button>
              </div>

              {/* Enable Edit Information */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <label className="text-sm text-gray-700 dark:text-gray-300">Enable Edit Information</label>
                <button
                  onClick={() => togglePermission('can_enable_employee_edit')}
                  disabled={isLoading}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  style={{
                    backgroundColor: hrPermissions.can_enable_employee_edit ? '#3b82f6' : '#d1d5db',
                  }}
                >
                  <span
                    className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                    style={{
                      transform: hrPermissions.can_enable_employee_edit ? 'translateX(22px)' : 'translateX(2px)',
                    }}
                  />
                </button>
              </div>
            </>
          )}
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleSavePermissions}
            disabled={isLoading || loadingPermissions}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Permissions'}
          </button>

          <button
            onClick={handleResetPassword}
            disabled={isLoading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            {isLoading ? 'Processing...' : 'Reset Password'}
          </button>
        </div>

        {/* Info Message */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            All changes to account status and permissions are permanent and will take effect immediately.
          </p>
        </div>
      </div>
    </Modal>
  );
};

