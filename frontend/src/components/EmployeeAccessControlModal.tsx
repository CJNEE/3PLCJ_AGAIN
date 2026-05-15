import { useState, useEffect } from 'react';
import { HRPermission } from '@/types';
import { Modal } from './Modal';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/api/apiService';
import { AlertCircle, Lock, Unlock, Shield, Key } from 'lucide-react';
import { LoadingSpinner } from './common';

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
  const [tempPassword, setTempPassword] = useState<string | null>(null);

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

  // Is the employee being managed an HR role?
  const isHR = employee?.role?.toLowerCase() === 'hr';

  // Load HR permissions when modal opens
  useEffect(() => {
    if (isOpen && employee && isHR) {
      loadHRPermissions();
    } else {
      setLoadingPermissions(false);
    }
  }, [isOpen, employee, isHR]);

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
      const existingResponse = await apiClient.get(`hr-permissions/?hr_employee=${employee.id}`);
      
      if (existingResponse.data && existingResponse.data.results?.length > 0) {
        const permId = existingResponse.data.results[0].id;
        await apiClient.patch(`hr-permissions/${permId}/`, {
          ...hrPermissions,
        });
      } else {
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
      setTempPassword(response.data.temporary_password);
      toast.success(`Password reset successful.`);
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
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'blacklist': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Employee Access Control" size="sm">
      <div className="p-6 space-y-6">
        <div className="text-center space-y-4">
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

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{employee?.full_name}</h3>
            <p className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mt-2 ${getStatusBadgeClass(employee?.status)}`}>
              {employee?.status || 'Active'}
            </p>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p className="font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight">{employee?.position}</p>
            <p className="font-medium">{employee?.role}</p>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Account Lock/Unlock */}
        <div className="space-y-3">
          <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-500">Security Status</h4>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              {accountLocked ? <Lock size={20} className="text-red-600" /> : <Unlock size={20} className="text-green-600" />}
              <div>
                <label className="text-sm font-bold text-gray-900 dark:text-white block">{accountLocked ? 'Locked' : 'Active'}</label>
                <p className="text-[10px] text-gray-500">{accountLocked ? 'No login access' : 'Full login access'}</p>
              </div>
            </div>
            <button
              onClick={() => toggleAccountLock(!accountLocked)}
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${accountLocked ? 'bg-gray-300' : 'bg-green-600'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${accountLocked ? 'translate-x-1' : 'translate-x-6'}`} />
            </button>
          </div>
        </div>

        {/* Temporary Password Reveal */}
        {tempPassword && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/40 p-4 rounded-xl animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400 mb-2">
              <Key size={16} />
              <span className="text-xs font-black uppercase tracking-widest">New Password Generated</span>
            </div>
            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30 text-center">
              <code className="text-xl font-black tracking-[0.3em] text-red-600">{tempPassword}</code>
            </div>
            <p className="text-[10px] text-yellow-700 dark:text-yellow-500 mt-2 text-center font-medium">Please copy and provide this to the employee immediately.</p>
          </div>
        )}

        {/* HR Permissions Section - Only show if employee is HR */}
        {isHR && (
          <>
            <hr className="border-gray-200 dark:border-gray-700" />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-red-600" />
                <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-500">HR Administrative Powers</h4>
              </div>

              {loadingPermissions ? (
                <div className="text-center py-4"><LoadingSpinner size="sm" /></div>
              ) : (
                <div className="space-y-2">
                  {[
                    { key: 'can_view_employees', label: 'View Employee Records' },
                    { key: 'can_edit_employee_info', label: 'Modify Personnel Info' },
                    { key: 'can_edit_payslip', label: 'Process Payroll/Payslips' },
                    { key: 'can_delete_employees', label: 'Terminate/Delete Staff' },
                    { key: 'can_enable_employee_edit', label: 'Authorize Profile Edits' },
                  ].map((perm) => (
                    <div key={perm.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-transparent hover:border-red-100 dark:hover:border-red-900/20 transition-all">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">{perm.label}</label>
                      <button
                        onClick={() => togglePermission(perm.key as PermKey)}
                        disabled={isLoading}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${hrPermissions[perm.key as PermKey] ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hrPermissions[perm.key as PermKey] ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={handleSavePermissions}
                    disabled={isLoading}
                    className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-xl transition-all shadow-lg shadow-red-600/20"
                  >
                    {isLoading ? 'Processing...' : 'Save Administrative Powers'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        <hr className="border-gray-200 dark:border-gray-700" />

        <div className="space-y-3">
          <button
            onClick={handleResetPassword}
            disabled={isLoading}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black uppercase tracking-widest text-[10px] py-3 rounded-xl transition-all hover:bg-gray-800 dark:hover:bg-gray-100"
          >
            {isLoading ? 'Resetting...' : 'Generate New Password'}
          </button>
          
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
            <AlertCircle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-red-700 dark:text-red-400 leading-tight">
              Security changes are instant. Resetting the password will invalidate the current one immediately.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
