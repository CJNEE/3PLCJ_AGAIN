import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { EmployeeManagePanel } from '@/components/EmployeeManagePanel';
import { AddEmployee } from '@/pages/admin/AddEmployee';

import { useAuth } from '@/hooks/useAuth';

export const AdminEmployeesPage = () => {
  const { canEditEmployeeInfo } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // When showAdd is true, keep Sidebar visible and render only AddEmployee content area
  if (showAdd) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        {/* DESKTOP SIDEBAR ONLY */}
        <div className="hidden lg:block">
          <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>

        <div className="p-4 lg:p-6 lg:ml-64 pb-32 lg:pb-6">
          {/* Mobile bottom navigation */}

          <AddEmployee onClose={() => setShowAdd(false)} onCancel={() => setShowAdd(false)} onCreated={() => setShowAdd(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* DESKTOP SIDEBAR ONLY */}
      <div className="hidden lg:block">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      <div className="p-4 lg:p-6 lg:ml-64 space-y-6 max-md:space-y-4 pb-32 lg:pb-6 max-md:p-3">
        {/* Mobile bottom navigation */}

        <div className="flex items-center justify-between">
          <div>

            <h1 className="text-3xl max-md:text-2xl font-bold mb-2 max-md:mb-1">Employee Management</h1>
            <p className="text-gray-600 dark:text-gray-400 max-md:text-xs">Manage employees and their information</p>
          </div>

          {canEditEmployeeInfo && (
            <div>
              <button onClick={() => setShowAdd(true)} className="inline-flex items-center px-4 py-2 max-md:px-3 max-md:py-1.5 max-md:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                Add Employee
              </button>
            </div>
          )}
        </div>

        <EmployeeManagePanel />
      </div>
    </div>
  );
};

export default AdminEmployeesPage;