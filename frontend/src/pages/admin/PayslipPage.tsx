import { useState, useMemo } from 'react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/common';
import { Sidebar } from '@/components/Sidebar';
import { PayslipDetailModal } from '@/components/PayslipDetailModal';
import { useGetPayroll, useGetHubs, useGetEmployees } from '@/hooks/useQueries';
import { Download, Search, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';

export const PayslipPage = () => {
  const { canEditPayroll } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sidebar should render even on desktop

  const [payrollPeriod, setPayrollPeriod] = useState('All');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [hubFilter, setHubFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch data
  const { data: payrollData, isLoading: payrollLoading } = useGetPayroll();
  const { data: hubsData, isLoading: hubsLoading } = useGetHubs();
  const { data: employeesData, isLoading: employeesLoading } = useGetEmployees();

  const payroll = normalizeApiResponse(payrollData);
  const hubs = normalizeApiResponse(hubsData);
  const employees = normalizeApiResponse(employeesData);

  // Calculate stats
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const approved = payroll.filter((p: any) => (p.status || '').toString().toLowerCase() === 'approved').length;
    const pending = payroll.filter((p: any) => (p.status || '').toString().toLowerCase() === 'pending' || (p.status || '').toString().toLowerCase() === 'processing').length;
    const drafts = payroll.filter((p: any) => (p.status || '').toString().toLowerCase() === 'draft').length;

    return {
      totalEmployees,
      approved,
      pending,
      drafts,
    };
  }, [payroll, employees]);

  // Get unique years from payroll data
  const years = useMemo(() => {
    const uniqueYears = new Set(
      payroll.map((p: any) => new Date(p.period_end || p.created_at).getFullYear().toString())
    );
    return ['All', ...Array.from(uniqueYears).sort().reverse()];
  }, [payroll]);

  // Get unique payroll periods
  const payrollPeriods = useMemo(() => {
    const unique = new Set(
      payroll.map((p: any) => p.period_start ? `${p.period_start} - ${p.period_end}` : 'Standard')
    );
    return ['All', ...Array.from(unique)];
  }, [payroll]);

  // Group payroll by hub
  const payrollByHub = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};

    payroll.forEach((record: any) => {
      const hubName = record.hub || 'Unknown Hub';
      if (!grouped[hubName]) {
        grouped[hubName] = [];
      }

      // Filter based on search and filters
      const matchesSearch =
        !searchTerm ||
        record.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.jtp_code?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesHub = hubFilter === 'All' || record.hub === hubFilter;
      const matchesStatus =
        statusFilter === 'All' || record.status === statusFilter;
      const matchesYear =
        year === 'All' || new Date(record.period_end || record.created_at).getFullYear().toString() === year;

      if (matchesSearch && matchesHub && matchesStatus && matchesYear) {
        grouped[hubName].push(record);
      }
    });

    return grouped;
  }, [payroll, searchTerm, hubFilter, statusFilter, year]);

  const handleDownload = (hubName: string) => {
    const hubData = payrollByHub[hubName];
    if (!hubData || hubData.length === 0) {
      alert('No data to download for this hub');
      return;
    }

    // Prepare CSV data
    const headers = [
      'Fullname', 'JTP Code', 'Hub', 'Period',
      'Total Hours', 'Overtime Hours', 'Lates', 'Absences',
      'Basic Pay', 'Allowance', 'Overtime Pay', 'Incentives',
      'Total Earnings', 'SSS Deduction', 'Philhealth Deduction', 'Pagibig Deduction',
      'Other Deductions', 'Total Deductions', 'Net Pay', 'Status'
    ];

    const rows = hubData.map((record: any) => {
      // Calculate total deductions for the CSV (gov + other)
      const govDeductions = (parseFloat(record.sss_deduction || '0')) + (parseFloat(record.philhealth_deduction || '0')) + (parseFloat(record.pagibig_deduction || '0'));
      const otherDeductions = parseFloat(record.total_deductions || '0');
      const totalDed = govDeductions + otherDeductions;
      
      return [
        record.fullname || record.full_name || 'N/A',
        record.jtp_code || 'N/A',
        record.hub || record.hub_name || 'N/A',
        record.payslip_period || (record.period_start && record.period_end ? `${record.period_start} - ${record.period_end}` : 'N/A'),
        record.total_hours || '0',
        record.overtime_hours || '0',
        record.lates || '0',
        record.absences || '0',
        record.basic_salary || '0',
        record.allowances || '0',
        record.overtime_pay || '0',
        record.incentives || '0',
        record.total_earnings || '0',
        record.sss_deduction || '0',
        record.philhealth_deduction || '0',
        record.pagibig_deduction || '0',
        otherDeductions,
        totalDed,
        record.net_pay || '0.00',
        record.status || 'N/A',
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(',')),
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hubName}-detailed-payroll-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'present':
        return 'success';
      case 'pending':
      case 'absent':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'info';
    }
  };

  if (payrollLoading || hubsLoading || employeesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        {/* Sidebar */}
        <div />
        <div className="p-4 lg:p-6 lg:ml-64 flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="p-4 lg:p-6 lg:ml-64 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Payslip Management</h1>
          <p className="text-gray-600 dark:text-gray-400">View and manage employee payslips by hub</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Employees */}
          <Card className="border-l-4 border-orange-500">
            <div className="text-center">
              <p className="text-orange-600 font-semibold text-sm">Total Employees</p>
              <p className="text-5xl font-bold text-orange-600 mt-3">{stats.totalEmployees}</p>
            </div>
          </Card>

          {/* Approved */}
          <Card className="border-l-4 border-green-500">
            <div className="text-center">
              <p className="text-green-600 font-semibold text-sm">Approved</p>
              <p className="text-5xl font-bold text-green-600 mt-3">{stats.approved}</p>
            </div>
          </Card>

          {/* Pending */}
          <Card className="border-l-4 border-yellow-600">
            <div className="text-center">
              <p className="text-yellow-600 font-semibold text-sm">Pending</p>
              <p className="text-5xl font-bold text-yellow-600 mt-3">{stats.pending}</p>
            </div>
          </Card>

          {/* Drafts */}
          <Card className="border-l-4 border-red-600">
            <div className="text-center">
              <p className="text-red-600 font-semibold text-sm">Drafts</p>
              <p className="text-5xl font-bold text-red-600 mt-3">{stats.drafts}</p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col lg:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Payroll Period
              </label>
              <select
                value={payrollPeriod}
                onChange={(e) => setPayrollPeriod(e.target.value)}
                aria-label="Filter by payroll period"
                className="input-field w-full"
              >
                {payrollPeriods.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                aria-label="Filter by year"
                className="input-field w-full"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Hub Name
              </label>
              <select
                value={hubFilter}
                onChange={(e) => setHubFilter(e.target.value)}
                aria-label="Filter by hub name"
                className="input-field w-full"
              >
                <option value="All">All Hubs</option>
                {hubs.map((hub: any) => (
                  <option key={hub.id} value={hub.name}>
                    {hub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="input-field w-full"
              >
                <option value="All">All Status</option>
                <option value="Approved">Approved</option>
                <option value="Present">Present</option>
                <option value="Pending">Pending</option>
                <option value="Absent">Absent</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Search Name
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search user here..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 w-full"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Payslip by Hub */}
        {Object.keys(payrollByHub).length > 0 ? (
          Object.entries(payrollByHub).map(([hubName, records]) => (
            <Card key={hubName}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-red-700">Payroll List</h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">{hubName}</div>
              </div>

              {records.length > 0 ? (
                <>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Fullname</th>
                          <th className="px-4 py-3 text-left font-semibold">JTP Code</th>
                          <th className="px-4 py-3 text-left font-semibold">Hub</th>
                          <th className="px-4 py-3 text-left font-semibold">Net Pay</th>
                          <th className="px-4 py-3 text-left font-semibold">Status</th>
                          <th className="px-4 py-3 text-center font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record: any, idx: number) => (
                          <tr
                            key={idx}
                            className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <td className="px-4 py-3 font-medium">{record.fullname || 'N/A'}</td>
                            <td className="px-4 py-3">{record.jtp_code || 'N/A'}</td>
                            <td className="px-4 py-3">{record.hub || hubName}</td>
                            <td className="px-4 py-3">₱{parseFloat(record.net_pay || '0').toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <Badge variant={getStatusBadgeVariant(record.status)}>
                                {record.status || 'N/A'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => {
                                  setSelectedPayslip(record);
                                  setIsModalOpen(true);
                                }}
                                className="btn btn-primary"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDownload(hubName)}
                                className="btn btn-secondary ml-2"
                              >
                                Download
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDownload(hubName)}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded flex items-center gap-2"
                    >
                      <Download size={18} />
                      Download
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-8">
                  <EmptyState
                    title="No records found"
                    description={`No payslip records found for ${hubName}`}
                  />
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <EmptyState
              title="No data available"
              description="No payslip records match your filters. Try adjusting your search criteria."
            />
          </Card>
        )}

        {/* Payslip Detail Modal */}
        <PayslipDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPayslip(null);
          }}
          payslip={selectedPayslip}
          onSave={(updatedPayslip: any) => {
            console.log('Updated Payslip:', updatedPayslip);
            // Add logic to update the payslip in the backend or state
          }}
        />
      </div>
    </div>
  );
};

