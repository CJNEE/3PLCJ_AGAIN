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
  employee?: number | string;
  employee_id?: number | string;
  tin?: string;
  sss_no?: string;
  philhealth_no?: string;
  pagibig_no?: string;
  net_pay?: number | string;
};

interface PayslipDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payslip: Payslip | null;
  allPayroll?: Payslip[];
  onApprove?: () => void;
  onSave?: (updatedPayslip: Payslip) => void;
}

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatPayslipPeriod = (startStr?: string, endStr?: string) => {
  if (!startStr || !endStr) return 'N/A';
  try {
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return `${startStr} - ${endStr}`;
    }
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const startMonth = monthNames[startDate.getMonth()];
    const startDay = startDate.getDate();
    const endMonth = monthNames[endDate.getMonth()];
    const endDay = endDate.getDate();
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    if (startMonth === endMonth && startYear === endYear) {
      return `${startMonth} ${startDay} to ${endDay}, ${startYear}`;
    } else {
      return `${startMonth} ${startDay}, ${startYear} to ${endMonth} ${endDay}, ${endYear}`;
    }
  } catch (e) {
    return `${startStr} - ${endStr}`;
  }
};

export const PayslipDetailModal = ({
  isOpen,
  onClose,
  payslip,
  allPayroll = [],
  onApprove,
  onSave,
}: PayslipDetailModalProps) => {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [localPayslip, setLocalPayslip] = useState<Payslip | null>(payslip);

  const history = (allPayroll || []).filter(p => {
    if (!payslip) return false;
    const pEmpId = p.employee || p.employee_id;
    const currentEmpId = payslip.employee || payslip.employee_id;
    return pEmpId && currentEmpId && pEmpId === currentEmpId && p.id !== localPayslip?.id;
  }).sort((a, b) => new Date(b.period_end || '').getTime() - new Date(a.period_end || '').getTime());

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
    <Modal isOpen={isOpen} onClose={onClose} title="" size="2xl">
      <div className="max-h-[90vh] overflow-y-auto bg-gray-50 dark:bg-slate-950">
        {/* HEADER AREA */}
        <div className="bg-gradient-to-r from-red-800 via-red-900 to-red-950 p-6 text-white relative shadow-lg">
          {/* Action Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <div>
              {!isEditMode && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/20 font-semibold py-1.5 px-4 rounded-xl transition-all text-xs"
                >
                  Edit Payroll
                </button>
              )}
            </div>
            <button
              onClick={handleDownload}
              className="hover:bg-white/10 p-2 rounded-full transition-all"
              aria-label="Download payslip"
            >
              <Download size={22} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Profile Picture */}
            <div className="shrink-0">
              {localPayslip?.profile_image_url || localPayslip?.profile_image ? (
                <img
                  src={localPayslip?.profile_image_url || localPayslip?.profile_image}
                  alt={localPayslip?.full_name || localPayslip?.fullname || 'Employee'}
                  className="w-20 h-20 rounded-2xl border-2 border-white/30 object-cover shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl border-2 border-white/30 bg-red-700 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                  {(localPayslip?.full_name || localPayslip?.fullname || 'E').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Employee Info & Grid */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold tracking-tight truncate">
                {localPayslip?.full_name || localPayslip?.fullname || 'N/A'}
              </h2>
              <p className="text-red-200 text-xs font-semibold tracking-wider uppercase mt-0.5">
                JTP Code: {localPayslip?.jtp_code || 'N/A'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 mt-4 text-xs text-white/80 border-t border-white/10 pt-3">
                <div>
                  <span className="text-[10px] text-red-200 font-bold uppercase tracking-wider block">Position</span>
                  <span className="font-semibold text-white truncate block">{localPayslip?.position || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-red-200 font-bold uppercase tracking-wider block">Date Hired</span>
                  <span className="font-semibold text-white block">
                    {localPayslip?.date_hired ? new Date(localPayslip.date_hired).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-red-200 font-bold uppercase tracking-wider block">Hub Name</span>
                  <span className="font-semibold text-white truncate block">{localPayslip?.hub_name || localPayslip?.hub || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payslip Period Banner */}
          <div className="mt-5 bg-white/10 backdrop-blur border border-white/10 px-4 py-2 rounded-2xl text-xs flex items-center justify-between">
            <span className="text-red-100 font-medium">Payslip Period:</span>
            <span className="font-bold text-white text-right">
              {formatPayslipPeriod(localPayslip?.period_start, localPayslip?.period_end)}
            </span>
          </div>
        </div>

        {/* GOVERNMENT IDS SECTION */}
        <div className="px-6 pt-6 pb-2">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
            <h4 className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-wider mb-3">Employee Government IDs</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-gray-500 font-medium">TIN:</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{localPayslip?.tin || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">SSS No:</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{localPayslip?.sss_no || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">PhilHealth No:</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{localPayslip?.philhealth_no || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Pag-IBIG No:</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{localPayslip?.pagibig_no || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* TWO COLUMN CONTENT PANEL */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN: EARNINGS */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
              <h3 className="text-gray-800 dark:text-gray-100 font-bold text-sm border-b pb-3 mb-4 flex justify-between items-center">
                <span>Earnings Breakdown</span>
                <span className="text-xs text-green-600 font-medium">In PHP</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Basic Salary</p>
                  {isEditMode ? (
                    <input
                      title="Basic Salary"
                      placeholder="Enter basic salary"
                      type="number"
                      value={formData.basic_salary}
                      onChange={(e) => setFormData((p) => ({ ...p, basic_salary: toNumber(e.target.value) }))}
                      className="input-field w-full mt-1"
                    />
                  ) : (
                    <p className="text-gray-800 dark:text-gray-200 font-bold mt-0.5">₱{toNumber(localPayslip?.basic_salary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  )}
                </div>

                <div>
                  <p className="text-gray-500 text-xs font-semibold">Allowances</p>
                  {isEditMode ? (
                    <input
                      title="Allowances"
                      placeholder="Enter allowances"
                      type="number"
                      value={formData.allowances}
                      onChange={(e) => setFormData((p) => ({ ...p, allowances: toNumber(e.target.value) }))}
                      className="input-field w-full mt-1"
                    />
                  ) : (
                    <p className="text-gray-800 dark:text-gray-200 font-semibold mt-0.5">₱{toNumber(localPayslip?.allowances).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  )}
                </div>

                <div>
                  <p className="text-gray-500 text-xs font-semibold">Overtime Pay</p>
                  {isEditMode ? (
                    <input
                      title="Overtime Pay"
                      placeholder="Enter overtime pay"
                      type="number"
                      value={formData.overtime_pay}
                      onChange={(e) => setFormData((p) => ({ ...p, overtime_pay: toNumber(e.target.value) }))}
                      className="input-field w-full mt-1"
                    />
                  ) : (
                    <p className="text-gray-800 dark:text-gray-200 font-semibold mt-0.5">₱{toNumber(localPayslip?.overtime_pay).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  )}
                </div>

                <div>
                  <p className="text-gray-500 text-xs font-semibold">Incentives</p>
                  {isEditMode ? (
                    <input
                      title="Incentives"
                      placeholder="Enter incentives"
                      type="number"
                      value={formData.incentives}
                      onChange={(e) => setFormData((p) => ({ ...p, incentives: toNumber(e.target.value) }))}
                      className="input-field w-full mt-1"
                    />
                  ) : (
                    <p className="text-gray-800 dark:text-gray-200 font-semibold mt-0.5">₱{toNumber(localPayslip?.incentives).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  )}
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 p-4 rounded-2xl flex justify-between items-center mt-6">
                  <span className="text-green-700 dark:text-green-400 font-bold text-xs">Total Earnings</span>
                  <span className="text-green-700 dark:text-green-400 font-extrabold text-sm">
                    ₱{toNumber(localPayslip?.total_earnings).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: DEDUCTIONS & ATTENDANCE */}
          <div className="space-y-6">
            {/* ATTENDANCE PANEL */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
              <h3 className="text-gray-800 dark:text-gray-100 font-bold text-xs border-b pb-3 mb-4">Attendance Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-400 font-medium">Total Hours</p>
                  <p className="text-gray-800 dark:text-gray-200 font-bold text-sm mt-0.5">
                    {localPayslip?.total_hours ?? localPayslip?.totalHours ?? '0'} hrs
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Overtime Hours</p>
                  <p className="text-gray-800 dark:text-gray-200 font-semibold text-sm mt-0.5">
                    {localPayslip?.overtime_hours ?? '0'} hrs
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Lates</p>
                  <p className="text-gray-800 dark:text-gray-200 font-semibold text-sm mt-0.5">
                    {localPayslip?.lates ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Absences</p>
                  <p className="text-gray-800 dark:text-gray-200 font-semibold text-sm mt-0.5">
                    {localPayslip?.absences ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* DEDUCTIONS PANEL */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
              <h3 className="text-gray-800 dark:text-gray-100 font-bold text-sm border-b pb-3 mb-4 flex justify-between items-center">
                <span>Deductions</span>
                <span className="text-xs text-red-600 font-medium">In PHP</span>
              </h3>

              {/* Government Deductions */}
              <div className="space-y-4">
                <div className="border-b pb-3 border-gray-100 dark:border-slate-800">
                  <p className="text-gray-500 text-xs font-semibold mb-2">Government Mandated Deductions</p>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">SSS</span>
                      {isEditMode ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={govPercents.sss}
                            onChange={(e) => setGovPercents((p) => ({ ...p, sss: toNumber(e.target.value) }))}
                            className="input-field w-16 text-right py-0.5"
                          />
                          <span className="text-gray-500 text-[10px]">% (₱{toNumber(localPayslip?.sss_deduction).toFixed(2)})</span>
                        </div>
                      ) : (
                        <span className="text-gray-800 dark:text-gray-200 text-xs font-bold">
                          ₱{toNumber(localPayslip?.sss_deduction).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({localPayslip?.sss_percent || '0'}%)
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">PhilHealth</span>
                      {isEditMode ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={govPercents.philhealth}
                            onChange={(e) => setGovPercents((p) => ({ ...p, philhealth: toNumber(e.target.value) }))}
                            className="input-field w-16 text-right py-0.5"
                          />
                          <span className="text-gray-500 text-[10px]">% (₱{toNumber(localPayslip?.philhealth_deduction).toFixed(2)})</span>
                        </div>
                      ) : (
                        <span className="text-gray-800 dark:text-gray-200 text-xs font-bold">
                          ₱{toNumber(localPayslip?.philhealth_deduction).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({localPayslip?.philhealth_percent || '0'}%)
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">Pag-IBIG</span>
                      {isEditMode ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={govPercents.pagibig}
                            onChange={(e) => setGovPercents((p) => ({ ...p, pagibig: toNumber(e.target.value) }))}
                            className="input-field w-16 text-right py-0.5"
                          />
                          <span className="text-gray-500 text-[10px]">% (₱{toNumber(localPayslip?.pagibig_deduction).toFixed(2)})</span>
                        </div>
                      ) : (
                        <span className="text-gray-800 dark:text-gray-200 text-xs font-bold">
                          ₱{toNumber(localPayslip?.pagibig_deduction).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({localPayslip?.pagibig_percent || '0'}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Other Deductions */}
                <div>
                  <p className="text-gray-500 text-xs font-semibold mb-2">Other Itemized Deductions</p>
                  {localPayslip?.deduction_details && Object.keys(localPayslip.deduction_details).length > 0 ? (
                    <div className="space-y-2 max-h-[120px] overflow-y-auto">
                      {Object.entries(localPayslip.deduction_details).map(([label, amount]) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">{label}</span>
                          <span className="text-gray-800 dark:text-gray-200 text-xs font-bold">
                            ₱{toNumber(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic text-[11px] py-1">No other deductions</p>
                  )}
                </div>

                {/* Total Deductions Panel */}
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex justify-between items-center mt-6">
                  <span className="text-red-700 dark:text-red-400 font-bold text-xs">Total Deductions</span>
                  <span className="text-red-700 dark:text-red-400 font-extrabold text-sm">
                    ₱{(toNumber(localPayslip?.total_deductions) + toNumber(localPayslip?.total_government_deductions)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM CARD: SALARY / NET PAY SUMMARY */}
        <div className="px-6 pb-6">
          <div className="bg-gradient-to-r from-blue-700 via-indigo-850 to-blue-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Net Salary Payday</p>
              <h3 className="text-3xl font-extrabold tracking-tight mt-1">
                ₱{(toNumber(localPayslip?.total_earnings ?? 0) - (toNumber(localPayslip?.total_deductions ?? 0) + toNumber(localPayslip?.total_government_deductions ?? 0))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            
            <div className="flex gap-4 items-center">
              <div>
                <span className="text-[10px] text-blue-200 uppercase font-black block text-right">Status</span>
                {isEditMode ? (
                  <select
                    title="Status"
                    value={formData.status}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                    className="input-field py-1 px-3 text-xs bg-white text-gray-800 rounded-xl mt-1"
                  >
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                  </select>
                ) : (
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mt-1 uppercase tracking-wider border shadow-sm ${
                    localPayslip?.status === 'approved'
                      ? 'bg-green-500 border-green-400 text-white'
                      : 'bg-yellow-500 border-yellow-400 text-white'
                  }`}>
                    {localPayslip?.status || 'Draft'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-800 bg-gray-100/50 dark:bg-slate-900/50 rounded-b-lg flex flex-col sm:flex-row gap-3 justify-end">
          {isEditMode ? (
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-md text-sm"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          ) : (
            <button
              onClick={handleApprove}
              disabled={isLoading || localPayslip?.status === 'approved'}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-md text-sm"
            >
              {isLoading ? 'Approving...' : localPayslip?.status === 'approved' ? 'Approved' : 'Approve Payslip'}
            </button>
          )}

          <button
            onClick={() => {
              setIsEditMode(false);
              onClose();
            }}
            className="bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold py-2.5 px-6 rounded-xl transition-all text-sm"
          >
            Close
          </button>
        </div>

        {/* HISTORY SECTION */}
        {history.length > 0 && (
          <div className="px-6 py-6 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Past Payslips History</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {history.map((prev) => (
                <div key={prev.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-900 transition-all shadow-sm">
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {formatPayslipPeriod(prev.period_start, prev.period_end)}
                    </p>
                    <p className="text-[10px] text-green-600 font-bold mt-1">Net Pay: ₱{toNumber(prev.net_pay || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <button
                    onClick={() => setLocalPayslip(prev)}
                    className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700"
                  >
                    View Record
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

