import { Card, Badge } from '@/components/common';
import { useGetEmployees, useGetAttendance } from '@/hooks/useQueries';
import { useAuth } from '@/hooks/useAuth';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';

export const HRDashboard = () => {
  const { employee } = useAuth();
  const employeesQuery = useGetEmployees();
  const attendanceQuery = useGetAttendance();

  const employees = normalizeApiResponse(employeesQuery.data);
  const attendance = normalizeApiResponse(attendanceQuery.data);

  const presentToday = attendance.filter((a: any) => a.status === 'Present').length;
  const absentToday = attendance.filter((a: any) => a.status === 'Absent').length;

  return (
    <div className="p-4 lg:p-6 lg:ml-64 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">HR Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back, {employee?.firstname}!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Employees</p>
          <p className="text-3xl font-bold text-primary mt-2">{employees.length}</p>
        </Card>
        <Card>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Present Today</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{presentToday}</p>
        </Card>
        <Card>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Absent Today</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{absentToday}</p>
        </Card>
      </div>

      {/* Employee List */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Employee List</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Position</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp: any) => (
                <tr key={emp.id} className="border-b dark:border-gray-700">
                  <td className="px-4 py-3 text-sm">{emp.full_name}</td>
                  <td className="px-4 py-3 text-sm">{emp.position}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={emp.status === 'Active' ? 'success' : 'warning'}>
                      {emp.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
