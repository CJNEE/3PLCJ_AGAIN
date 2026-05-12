import { useEffect, useState } from 'react';

import { Modal } from './Modal';
import { useToast } from '@/hooks/useToast';
import { useUpdatePayroll, useCreatePayroll } from '@/hooks/useQueries';
import { Download } from 'lucide-react';

type PayslipStatus = 'draft' | 'approved' | 'pending' | string;

type Payslip = {
  id?: number;
  basic_salary?: number | string;
  allowances?: number | string;
  overtime_pay?: number | string;
  incentives?: number | string;
  sss_deduction?: number | string;
  philhealth_deduction?: number | string;
  pagibig_deduction?: number | string;
  deduction_details?: Record<string, number>;
  total_deductions?: number | string;
  total_government_deductions?: number | string;
  total_earnings?: number | string;
  status?: PayslipStatus;

  total_hours?: number | string;
  overtime_hours?: number | string;
  lates?: number | string;
  absences?: number | string;

  profile_image_url?: string;
  profile_image?: string;
  full_name?: string;
  fullname?: string;
  jtp_code?: string;
  position?: string;
  date_hired?: string;
  hub_name?: string;
  hub?: string;
  payslip_period?: string;
  period_start?: string;
  period_end?: string;
};

interface PayslipDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payslip: Payslip | null;
  onApprove?: () => void;
  onSave?: (updatedPayslip: Payslip) => void;
}

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const PayslipDetailModal = ({
  isOpen,
  onClose,
  payslip,
  onApprove,
  onSave,
}: PayslipDetailModalProps) => {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [localPayslip, setLocalPayslip] = useState<Payslip | null>(payslip);

  const [formData, setFormData] = useState({
    basic_salary: toNumber(payslip?.basic_salary ?? 0),
    allowances: toNumber(payslip?.allowances ?? 0),
    overtime_pay: toNumber(payslip?.overtime_pay ?? 0),
    incentives: toNumber(payslip?.incentives ?? 0),
    sss_deduction: toNumber(payslip?.sss_deduction ?? 0),
    philhealth_deduction: toNumber(payslip?.philhealth_deduction ?? 0),
    pagibig_deduction: toNumber(payslip?.pagibig_deduction ?? 0),
    status: (payslip?.status as PayslipStatus) || 'draft',
  });

  const updatePayrollMutation = useUpdatePayroll();
  const createPayrollMutation = useCreatePayroll();

  useEffect(() => {
    setLocalPayslip(payslip);
    setFormData({
      basic_salary: toNumber(payslip?.basic_salary ?? 0),
      allowances: toNumber(payslip?.allowances ?? 0),
      overtime_pay: toNumber(payslip?.overtime_pay ?? 0),
      incentives: toNumber(payslip?.incentives ?? 0),
      sss_deduction: toNumber(payslip?.sss_deduction ?? 0),
      philhealth_deduction: toNumber(payslip?.philhealth_deduction ?? 0),
      pagibig_deduction: toNumber(payslip?.pagibig_deduction ?? 0),
      status: (payslip?.status as PayslipStatus) || 'draft',
    });
    setIsEditMode(false);
  }, [payslip]);

  const handleSave = async () => {
    // Build payload from form and local state
    const payload = {
      basic_salary: toNumber(formData.basic_salary),
      allowances: toNumber(formData.allowances),
      overtime_pay: toNumber(formData.overtime_pay),
      incentives: toNumber(formData.incentives),
      sss_deduction: toNumber(formData.sss_deduction),
      philhealth_deduction: toNumber(formData.philhealth_deduction),
      pagibig_deduction: toNumber(formData.pagibig_deduction),
      // keep JSON safe
      deduction_details: localPayslip?.deduction_details ?? {},
      status: formData.status,
    };

    try {
      setIsLoading(true);

      // If there is an existing payroll id, update. Otherwise create a new payroll record.
      if (payslip?.id) {
        const updated = await updatePayrollMutation.mutateAsync({ id: payslip.id, data: payload });
        setLocalPayslip(updated);
        setIsEditMode(false);
        success('Payroll updated successfully');
        onSave?.(updated);
      } else {
        // determine employee id and period info
        // Resolve employee id from possible shapes (number, {id}, string)
        const maybeEmployee = (localPayslip as any)?.employee ?? (localPayslip as any)?.employee_id ?? (payslip as any)?.employee ?? (payslip as any)?.employee_id;
        let employeeId: number | null = null;
        if (typeof maybeEmployee === 'number') employeeId = maybeEmployee;
        else if (typeof maybeEmployee === 'string' && /^\d+$/.test(maybeEmployee)) employeeId = parseInt(maybeEmployee, 10);
        else if (maybeEmployee && typeof maybeEmployee === 'object' && (maybeEmployee as any).id) employeeId = (maybeEmployee as any).id;

        const period_start = (localPayslip as any)?.period_start || (payslip as any)?.period_start;
        const period_end = (localPayslip as any)?.period_end || (payslip as any)?.period_end;

        if (!employeeId) {
          throw new Error('Missing employee id for creating payroll');
        }

        const createPayload = { ...payload, employee: employeeId } as any;

        // Ensure period_start/period_end are provided (backend requires these fields)
        const todayISO = new Date().toISOString().slice(0, 10);
        createPayload.period_start = period_start || todayISO;
        createPayload.period_end = period_end || todayISO;

        // Ensure deduction_details exists
        if (!createPayload.deduction_details) createPayload.deduction_details = {};

        const created = await createPayrollMutation.mutateAsync(createPayload);
        setLocalPayslip(created);
        setIsEditMode(false);
        success('Payroll created successfully');
        onSave?.(created);
      }
    } catch (err: unknown) {
      const axiosErr = err as any;
      error(axiosErr?.response?.data?.detail || axiosErr?.message || 'Failed to save payroll');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this payslip?')) return;

    try {
      setIsLoading(true);
      // TODO: Add API call to approve payslip
      success('Payslip approved successfully');
      onApprove?.();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as any;
      error(axiosErr?.response?.data?.message || 'Failed to approve payslip');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    try {
      // TODO: implement real download
      success('Payslip downloaded successfully');
    } catch {
      error('Failed to download payslip');
    }
  };

  if (!payslip) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="max-h-[90vh] overflow-y-auto">
        <div className="bg-red-600 p-6 text-white relative">
          <div className="flex gap-6">
            <div>
              {localPayslip?.profile_image_url || localPayslip?.profile_image ? (
                <img
                  src={localPayslip?.profile_image_url || localPayslip?.profile_image}
                  alt={localPayslip?.full_name || localPayslip?.fullname || 'Employee'}
                  className="w-24 h-24 rounded border-2 border-white object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded border-2 border-white bg-red-500 flex items-center justify-center text-white text-3xl font-bold">
                  {(localPayslip?.full_name || localPayslip?.fullname || 'E').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-1xl font-bold mb-1">
                {localPayslip?.full_name || localPayslip?.fullname || 'N/A'}
              </h2>
              <p className="text-sm mb-3">{localPayslip?.jtp_code || 'N/A'}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
              </div>
            </div>
          </div>
        <div className='mt-4 bg-red-700 bg-opacity-50 px-5 py-2 rounded text-sm font-bold inline-block'>
            <p className="opacity-90">Date Hired:</p>
            <p className="font-bold text-sm">{localPayslip?.date_hired || 'N/A'}</p>
        </div>
        <div className='mt-4 ml-5 bg-red-700 bg-opacity-50 px-7 py-2 rounded text-sm font-bold inline-block'>
            <p className="opacity-90">Position</p>
            <p className="font-bold text-sm">{localPayslip?.position || 'N/A'}</p>
        </div>
        <div className='mt-4 bg-red-700 bg-opacity-50 px-4 py-2 rounded text-sm font-bold inline-block'>
                    <p className="opacity-90">
                    Hub Name:{' '}
                    <span className="font-bold text-sm">
                        {localPayslip?.hub_name || localPayslip?.hub || 'N/A'}
                </span></p>
            </div>
          <div className="mt-4 bg-red-700 bg-opacity-50 px-4 py-2 rounded text-sm font-bold inline-block">
            <p className="opacity-90">
              Payslip Period:{' '}
              <span className="font-bold text-sm">
                {localPayslip?.payslip_period || `${localPayslip?.period_start || 'N/A'} - ${localPayslip?.period_end || 'N/A'}`}
              </span>
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="bg-red-200 px-4 py-2 text-gray-600 text-sm text-sm mb-3 rounded font-bold">Attendance Summary</h3>
            <div className="bg-white border border-gray-300 rounded p-4 space-y-3">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 text-sm font-bold">Total Hours:</p>
                  <p className="text-gray-600 text-sm">{payslip?.total_hours || '0'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-bold">Overtime:</p>
                  <p className="text-gray-600 text-sm">{payslip?.overtime_hours || '0'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 text-sm font-bold">Lates:</p>
                  <p className="text-gray-600 text-sm">{payslip?.lates || '0'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-bold">Absences:</p>
                  <p className="text-gray-600 text-sm">{payslip?.absences || '0'}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="bg-red-200 px-4 py-2 text-gray-600 text-sm text-sm mb-3 rounded font-bold">Earnings</h3>
            <div className="bg-white border border-gray-300 rounded p-4 space-y-3">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 text-sm font-bold">Basic Pay:</p>
                  {isEditMode ? (
                    <input
                      title="Basic Salary"
                      placeholder="Enter basic salary"
                      type="number"
                      value={formData.basic_salary}
                      onChange={(e) => setFormData((p) => ({ ...p, basic_salary: Number(e.target.value) }))}
                      className="input-field w-full"
                    />
                  ) : (
                    <p className="text-gray-600 text-sm">₱{toNumber(localPayslip?.basic_salary).toFixed(2)}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-bold">Allowance:</p>
                  {isEditMode ? (
                    <input
                      title="Allowances"
                      placeholder="Enter allowances"
                      type="number"
                      value={formData.allowances}
                      onChange={(e) => setFormData((p) => ({ ...p, allowances: Number(e.target.value) }))}
                      className="input-field w-full"
                    />
                  ) : (
                    <p className="text-gray-600 text-sm">₱{toNumber(localPayslip?.allowances).toFixed(2)}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 text-sm font-bold">Overtime Pay:</p>
                  {isEditMode ? (
                    <input
                      title="Overtime Pay"
                      placeholder="Enter overtime pay"
                      type="number"
                      value={formData.overtime_pay}
                      onChange={(e) => setFormData((p) => ({ ...p, overtime_pay: Number(e.target.value) }))}
                      className="input-field w-full"
                    />
                  ) : (
                    <p className="text-gray-600 text-sm">₱{toNumber(localPayslip?.overtime_pay).toFixed(2)}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-bold">Incentives:</p>
                  {isEditMode ? (
                    <input
                      title="Incentives"
                      placeholder="Enter incentives"
                      type="number"
                      value={formData.incentives}
                      onChange={(e) => setFormData((p) => ({ ...p, incentives: Number(e.target.value) }))}
                      className="input-field w-full"
                    />
                  ) : (
                    <p className="text-gray-600 text-sm">₱{toNumber(localPayslip?.incentives).toFixed(2)}</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-100 p-3 rounded mt-2">
                <p className="text-gray-600 text-sm font-bold">Total Earnings:</p>
                <p className="text-gray-600 text-sm">₱{toNumber(localPayslip?.total_earnings).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="bg-red-200 px-4 py-2 text-gray-600 text-sm text-sm mb-3 rounded font-bold">Deductions</h3>
            <div className="bg-white border border-gray-300 rounded p-4">
              {localPayslip?.deduction_details && Object.keys(localPayslip.deduction_details).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(localPayslip.deduction_details).map(([label, amount]) => (
                    <div key={label} className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-gray-600 text-sm">{label}:</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">₱{toNumber(amount).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No itemized deductions available</p>
              )}

              <div className="border-t pt-2 grid grid-cols-2 gap-6 mt-3">
                <p className="text-gray-600 text-sm font-bold">Total:</p>
                <p className="text-gray-600 text-sm">₱{toNumber(localPayslip?.total_deductions).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="bg-gray-300 px-4 py-2 text-gray-600 text-sm text-sm mb-3 rounded font-bold">Government Deductions</h3>
            <div className="bg-white border border-gray-300 rounded p-4 space-y-3">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 text-sm font-bold">SSS:</p>
                  {isEditMode ? (
                    <input
                      title="SSS Deduction"
                      placeholder="Enter SSS deduction"
                      type="number"
                      value={formData.sss_deduction}
                      onChange={(e) => setFormData((p) => ({ ...p, sss_deduction: Number(e.target.value) }))}
                      className="input-field w-full"
                    />
                  ) : (
                    <p className="text-gray-600 text-sm">₱{toNumber(localPayslip?.sss_deduction).toFixed(2)}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-bold">Philhealth:</p>
                  {isEditMode ? (
                    <input
                      title="PhilHealth Deduction"
                      placeholder="Enter PhilHealth deduction"
                      type="number"
                      value={formData.philhealth_deduction}
                      onChange={(e) => setFormData((p) => ({ ...p, philhealth_deduction: Number(e.target.value) }))}
                      className="input-field w-full"
                    />
                  ) : (
                    <p className="text-gray-600 text-sm">₱{toNumber(localPayslip?.philhealth_deduction).toFixed(2)}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 text-sm font-bold">Pag-IBIG:</p>
                  {isEditMode ? (
                    <input
                      title="Pag-IBIG Deduction"
                      placeholder="Enter Pag-IBIG deduction"
                      type="number"
                      value={formData.pagibig_deduction}
                      onChange={(e) => setFormData((p) => ({ ...p, pagibig_deduction: Number(e.target.value) }))}
                      className="input-field w-full"
                    />
                  ) : (
                    <p className="text-gray-600 text-sm">₱{toNumber(localPayslip?.pagibig_deduction).toFixed(2)}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-bold">Status:</p>
                  {isEditMode ? (
                    <select
                      title="Status"
                      value={formData.status}
                      onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                      className="input-field w-full"
                    >
                      <option value="draft">Draft</option>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                    </select>
                  ) : (
                    <p className="text-gray-600 text-sm ">{localPayslip?.status || 'N/A'}</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-2 grid grid-cols-2 gap-6">
                <p className="text-gray-600 text-sm font-bold">Total:</p>
                <p className="text-gray-600 text-sm">₱{toNumber(localPayslip?.total_government_deductions).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-100 border-2 border-blue-300 rounded p-4">
            <p className="text-gray-600 text-sm font-bold">Total Deduction:</p>
            <p className="text-gray-600 text-sm font-bold">
              ₱
              {(
                toNumber(localPayslip?.total_deductions) + toNumber(localPayslip?.total_government_deductions)
              ).toFixed(2)}
            </p>
          </div>

          <div>
            <h3 className="bg-red-200 px-4 py-2 text-gray-600 text-sm text-sm mb-3 rounded font-bold  ">Salary</h3>
            <div className="bg-white border border-gray-300 rounded p-4 space-y-4">
              <div className="flex justify-between pb-2 border-b">
                <p className="text-gray-600 font-bold">Total Earnings:</p>
                <p className="text-gray-600 text-sm">₱{toNumber(payslip?.total_earnings).toFixed(2)}</p>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <p className="text-gray-600 font-bold">Total Deduction:</p>
                <p className="text-gray-600 text-sm">
                  ₱{(toNumber(payslip?.total_deductions) + toNumber(payslip?.total_government_deductions)).toFixed(2)}
                </p>
              </div>
              <div className="flex justify-between py-2 bg-blue-50 px-3 rounded font-bold text-lg">
                <p>Total Salary:</p>
                <p>
                  ₱
                  {(
                    toNumber(payslip?.total_earnings) -
                    (toNumber(payslip?.total_deductions) + toNumber(payslip?.total_government_deductions))
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

