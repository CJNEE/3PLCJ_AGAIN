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
  // alternate keys sometimes returned by the API
  totalHours?: number | string;
  sss_percent?: number | string;
  philhealth_percent?: number | string;
  pagibig_percent?: number | string;

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
    // government deductions are fixed rates — not editable here
    status: (payslip?.status as PayslipStatus) || 'draft',
  });

  const [govPercents, setGovPercents] = useState({
    sss: toNumber((payslip as any)?.sss_percent ?? (localPayslip as any)?.sss_percent ?? 0),
    philhealth: toNumber((payslip as any)?.philhealth_percent ?? (localPayslip as any)?.philhealth_percent ?? 0),
    pagibig: toNumber((payslip as any)?.pagibig_percent ?? (localPayslip as any)?.pagibig_percent ?? 0),
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
      status: (payslip?.status as PayslipStatus) || 'draft',
    });
    setIsEditMode(false);
    setGovPercents({
      sss: toNumber((payslip as any)?.sss_percent ?? (localPayslip as any)?.sss_percent ?? 0),
      philhealth: toNumber((payslip as any)?.philhealth_percent ?? (localPayslip as any)?.philhealth_percent ?? 0),
      pagibig: toNumber((payslip as any)?.pagibig_percent ?? (localPayslip as any)?.pagibig_percent ?? 0),
    });
  }, [payslip]);

  // If there's no persisted payslip id, fetch a computed summary from the backend
  useEffect(() => {
    const fetchComputed = async () => {
      if (!isOpen) return;
      // If payslip exists and has an id, nothing to compute
      if (payslip && payslip.id) return;

      // Determine employee and period from payslip prop
      const employee = (payslip as any)?.employee ?? (payslip as any)?.employee_id ?? (localPayslip as any)?.employee;
      const period_start = (payslip as any)?.period_start || (localPayslip as any)?.period_start;
      const period_end = (payslip as any)?.period_end || (localPayslip as any)?.period_end;
      if (!employee || !period_start || !period_end) return;

      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        params.set('employee_id', String(typeof employee === 'object' ? (employee as any).id : employee));
        params.set('period_start', period_start);
        params.set('period_end', period_end);
        params.set('basic_salary', String(toNumber(formData.basic_salary)));
        params.set('allowances', String(toNumber(formData.allowances)));
        params.set('overtime_pay', String(toNumber(formData.overtime_pay)));
        params.set('incentives', String(toNumber(formData.incentives)));

        const res = await fetch(`/api/payroll/compute/?${params.toString()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        });
        if (!res.ok) throw new Error('Failed to compute payslip');
        const data = await res.json();
        setLocalPayslip((p) => ({ ...(p as any), ...data } as Payslip));
        // initialize gov percents from computed result
        setGovPercents({
          sss: toNumber((data as any).sss_percent ?? (data as any).sss_percent ?? 0),
          philhealth: toNumber((data as any).philhealth_percent ?? (data as any).philhealth_percent ?? 0),
          pagibig: toNumber((data as any).pagibig_percent ?? (data as any).pagibig_percent ?? 0),
        });
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComputed();
  }, [isOpen, payslip]);

  const handleSave = async () => {
    // Build payload from form and local state
    const payload = {
      basic_salary: toNumber(formData.basic_salary),
      allowances: toNumber(formData.allowances),
      overtime_pay: toNumber(formData.overtime_pay),
      incentives: toNumber(formData.incentives),
      // government deductions are computed on the backend from total earnings; do not send
      // keep JSON safe
      deduction_details: localPayslip?.deduction_details ?? {},
      // include gov percent overrides so backend can persist and compute based on them
      sss_percent: govPercents.sss,
      philhealth_percent: govPercents.philhealth,
      pagibig_percent: govPercents.pagibig,
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

  // Recompute government deductions and totals when earnings or govPercents change
  useEffect(() => {
    const totalEarnings =
      toNumber(formData.basic_salary) +
      toNumber(formData.allowances) +
      toNumber(formData.overtime_pay) +
      toNumber(formData.incentives) || toNumber(localPayslip?.total_earnings);

    const sssDed = (govPercents.sss / 100) * totalEarnings;
    const philDed = (govPercents.philhealth / 100) * totalEarnings;
    const pagibigDed = (govPercents.pagibig / 100) * totalEarnings;

    const govTotal = sssDed + philDed + pagibigDed;
    const otherDeductions = toNumber(localPayslip?.total_deductions ?? 0);

    setLocalPayslip((p) => ({
      ...(p as any),
      sss_percent: govPercents.sss,
      philhealth_percent: govPercents.philhealth,
      pagibig_percent: govPercents.pagibig,
      sss_deduction: sssDed,
      philhealth_deduction: philDed,
      pagibig_deduction: pagibigDed,
      total_government_deductions: govTotal,
      total_deductions: otherDeductions,
      total_earnings: totalEarnings,
    } as Payslip));
  }, [formData.basic_salary, formData.allowances, formData.overtime_pay, formData.incentives, govPercents, localPayslip?.total_deductions]);

  const handleDownload = () => {
    if (!localPayslip) return;
    try {
      const headers = [
        'Fullname', 'JTP Code', 'Position', 'Hub', 'Period',
        'Total Hours', 'Overtime Hours', 'Lates', 'Absences',
        'Basic Pay', 'Allowance', 'Overtime Pay', 'Incentives',
        'Total Earnings', 'SSS Deduction', 'Philhealth Deduction', 'Pagibig Deduction',
        'Other Deductions', 'Total Deductions', 'Net Pay', 'Status'
      ];

      const govDeductions = (toNumber(localPayslip.sss_deduction)) + (toNumber(localPayslip.philhealth_deduction)) + (toNumber(localPayslip.pagibig_deduction));
      const otherDeductions = toNumber(localPayslip.total_deductions);
      const totalDed = govDeductions + otherDeductions;
      const netPay = toNumber(localPayslip.total_earnings) - totalDed;

      const row = [
        localPayslip.full_name || localPayslip.fullname || 'N/A',
        localPayslip.jtp_code || 'N/A',
        localPayslip.position || 'N/A',
        localPayslip.hub_name || localPayslip.hub || 'N/A',
        localPayslip.payslip_period || `${localPayslip.period_start} - ${localPayslip.period_end}`,
        localPayslip.total_hours || '0',
        localPayslip.overtime_hours || '0',
        localPayslip.lates || '0',
        localPayslip.absences || '0',
        localPayslip.basic_salary || '0',
        localPayslip.allowances || '0',
        localPayslip.overtime_pay || '0',
        localPayslip.incentives || '0',
        localPayslip.total_earnings || '0',
        localPayslip.sss_deduction || '0',
        localPayslip.philhealth_deduction || '0',
        localPayslip.pagibig_deduction || '0',
        otherDeductions,
        totalDed,
        netPay.toFixed(2),
        localPayslip.status || 'N/A'
      ];

      const csvContent = [
        headers.join(','),
        row.map(cell => `"${cell}"`).join(',')
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip-${localPayslip.full_name || 'Employee'}-${localPayslip.period_end}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      success('Payslip downloaded successfully');
    } catch (err) {
      console.error(err);
      error('Failed to download payslip');
    }
  };

  if (!payslip && !localPayslip) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="max-h-[90vh] overflow-y-auto">
        <div className="bg-red-600 p-6 text-white relative">
          <button
            onClick={handleDownload}
            className="absolute top-4 right-4 hover:bg-red-700 p-2 rounded transition-colors"
            aria-label="Download payslip"
          >
            <Download size={24} />
          </button>

          {/* Move Edit Payroll to top-left */}
          <div className="absolute top-4 left-4">
            <button onClick={() => setIsEditMode(true)} className="btn btn-primary">
              Edit Payroll
            </button>
          </div>

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

            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">
                {localPayslip?.full_name || localPayslip?.fullname || 'N/A'}
              </h2>
              <p className="text-sm mb-3">{localPayslip?.jtp_code || 'N/A'}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="opacity-90">Position</p>
                  <p className="text-gray-600 text-sm">{localPayslip?.position || 'N/A'}</p>
                </div>
                <div>
                  <p className="opacity-90">Date Hired:</p>
                  <p className="text-gray-600 text-sm">{localPayslip?.date_hired || 'N/A'}</p>
                </div>
                <div>
                  <p className="opacity-90 font-bold">Hub Name :</p>
                  <p className="text-gray-600 text-sm">{localPayslip?.hub_name || localPayslip?.hub || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-red-700 bg-opacity-50 px-4 py-2 rounded text-sm font-bold inline-block">
            <p className="opacity-90">
              Payslip Period:{' '}
              <span className="text-gray-600 text-sm">
                {localPayslip?.payslip_period || `${localPayslip?.period_start || 'N/A'} - ${localPayslip?.period_end || 'N/A'}`}
              </span>
            </p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="bg-red-200 px-4 py-2 text-gray-600 text-sm text-sm mb-3 rounded font-bold">Attendance Summary</h3>
            <div className="bg-white border border-gray-300 rounded p-4 space-y-3">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 text-sm font-bold">Total Hours:</p>
                  <p className="text-gray-600 text-sm">{localPayslip?.total_hours ?? localPayslip?.totalHours ?? '0'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-bold">Overtime:</p>
                  <p className="text-gray-600 text-sm">{localPayslip?.overtime_hours ?? '0'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 text-sm font-bold">Lates:</p>
                  <p className="text-gray-600 text-sm">{localPayslip?.lates ?? 0}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-bold">Absences:</p>
                  <p className="text-gray-600 text-sm">{localPayslip?.absences ?? 0}</p>
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
                      onChange={(e) => setFormData((p) => ({ ...p, basic_salary: toNumber(e.target.value) }))}
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
                      onChange={(e) => setFormData((p) => ({ ...p, allowances: toNumber(e.target.value) }))}
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
                      onChange={(e) => setFormData((p) => ({ ...p, overtime_pay: toNumber(e.target.value) }))}
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
                      onChange={(e) => setFormData((p) => ({ ...p, incentives: toNumber(e.target.value) }))}
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
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={govPercents.sss}
                        onChange={(e) => setGovPercents((p) => ({ ...p, sss: toNumber(e.target.value) }))}
                        className="input-field w-24"
                      />
                      <span className="text-gray-600 text-sm">% • ₱{toNumber(localPayslip?.sss_deduction).toFixed(2)}</span>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">{localPayslip?.sss_percent || '—'}% • ₱{toNumber(localPayslip?.sss_deduction).toFixed(2)}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-bold">Philhealth:</p>
                  {isEditMode ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={govPercents.philhealth}
                        onChange={(e) => setGovPercents((p) => ({ ...p, philhealth: toNumber(e.target.value) }))}
                        className="input-field w-24"
                      />
                      <span className="text-gray-600 text-sm">% • ₱{toNumber(localPayslip?.philhealth_deduction).toFixed(2)}</span>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">{localPayslip?.philhealth_percent || '—'}% • ₱{toNumber(localPayslip?.philhealth_deduction).toFixed(2)}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 text-sm font-bold">Pag-IBIG:</p>
                  {isEditMode ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={govPercents.pagibig}
                        onChange={(e) => setGovPercents((p) => ({ ...p, pagibig: toNumber(e.target.value) }))}
                        className="input-field w-24"
                      />
                      <span className="text-gray-600 text-sm">% • ₱{toNumber(localPayslip?.pagibig_deduction).toFixed(2)}</span>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">{localPayslip?.pagibig_percent || '—'}% • ₱{toNumber(localPayslip?.pagibig_deduction).toFixed(2)}</p>
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

          <div className="bg-blue-50 p-3 rounded">
            <p className="text-gray-600 text-sm font-bold">Total Pay:</p>
            <p className="text-gray-600 text-lg font-bold">₱{(toNumber(localPayslip?.total_earnings ?? 0) - (toNumber(localPayslip?.total_deductions ?? 0) + toNumber(localPayslip?.total_government_deductions ?? 0))).toFixed(2)}</p>
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
                <p className="text-gray-600 text-sm">₱{toNumber(localPayslip?.total_earnings ?? 0).toFixed(2)}</p>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <p className="text-gray-600 font-bold">Total Deduction:</p>
                <p className="text-gray-600 text-sm">₱{(toNumber(localPayslip?.total_deductions ?? 0) + toNumber(localPayslip?.total_government_deductions ?? 0)).toFixed(2)}</p>
              </div>
              <div className="flex justify-between py-2 bg-blue-50 px-3 rounded font-bold text-lg">
                <p>Total Salary:</p>
                <p>₱{(toNumber(localPayslip?.total_earnings ?? 0) - (toNumber(localPayslip?.total_deductions ?? 0) + toNumber(localPayslip?.total_government_deductions ?? 0))).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {isEditMode ? (
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-4 rounded transition-colors"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            ) : (
              <button
                onClick={handleApprove}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 px-4 rounded transition-colors"
              >
                {isLoading ? 'Approving...' : 'Approve'}
              </button>
            )}

            <button
              onClick={() => {
                setIsEditMode(false);
                onClose();
              }}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-4 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

