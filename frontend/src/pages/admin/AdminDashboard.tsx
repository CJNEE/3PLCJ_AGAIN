import { useState, useMemo, useEffect } from 'react';
import { useGetEmployees, useGetHubs, useGetAttendance, useGetSecurityAlerts, useGetActivityLogs } from '@/hooks/useQueries';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { Search, Eye, X, User, Phone, Briefcase, Shield, Landmark, Clock } from 'lucide-react';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HubsEmployeeChart from '@/components/HubsEmployeeChart';
import { Sidebar } from '@/components/Sidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { ThemeToggle } from '@/context/ThemeContext';
import logo from '@/images/3pl4.png';
import type { Employee, Hub } from '@/types';

// Color mappings for status
const STATUS_COLORS: Record<string, string> = {
  'Active': '#10B981',      // green
  'AWOL': '#F59E0B',        // yellow
  'Blacklist': '#EF4444',   // red
  'Resign': '#3B82F6',      // blue
};

const EMPLOYMENT_TYPE_COLORS: Record<string, string> = {
  'Full-time': '#3B82F6',
  'Full time': '#3B82F6',
  'OCW': '#3B82F6',
};

// Create beautiful custom SVG markers for Leaflet
const hubIcon = L.divIcon({
  className: 'custom-hub-marker',
  html: `
    <div class="relative flex items-center justify-center" style="width: 28px; height: 28px;">
      <div class="absolute w-7 h-7 bg-red-500/30 rounded-full animate-ping"></div>
      <div class="relative w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

// Fit bounds component for Leaflet map
function FitBoundsComponent({
  mapHubs,
  getCoords,
}: {
  mapHubs: Hub[];
  getCoords: (hub: Hub) => [number, number];
}) {
  const map = useMap();
  useEffect(() => {
    if (mapHubs && mapHubs.length > 0) {
      const bounds = L.latLngBounds(mapHubs.map(hub => getCoords(hub)));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [mapHubs, map, getCoords]);
  return null;
}

export const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHubTerm, setSearchHubTerm] = useState('');
  const [searchLocationTerm, setSearchLocationTerm] = useState('');

  type SelectedEmployee = (Omit<Partial<Employee>, 'id'> & { id?: string | number }) | null;
  const [selectedEmployee, setSelectedEmployee] = useState<SelectedEmployee>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  // Fetch data
  const employeesQuery = useGetEmployees({ hub_id: null });
  const hubsQuery = useGetHubs();

  // Loading state
  const isLoading = employeesQuery.isLoading || hubsQuery.isLoading;

  // Process data
  const allEmployees = normalizeApiResponse(employeesQuery.data) as Employee[];
  const hubs = normalizeApiResponse(hubsQuery.data) as Hub[];
  const totalEmployees = allEmployees.length;

  const employees = useMemo(() => {
    return allEmployees.filter(
      (emp) =>
        emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    ) as Array<Omit<Partial<Employee>, 'id'> & { id?: string | number }>;
  }, [allEmployees, searchTerm]);

  // Calculate stats
  const employmentTypeData = useMemo(() => {
    const types = {} as Record<string, number>;
    allEmployees.forEach((emp) => {
      const key = emp.employment_type;
      if (!key) return;
      types[key] = (types[key] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [allEmployees]);

  const statusData = useMemo(() => {
    const statuses = {} as Record<string, number>;
    allEmployees.forEach((emp) => {
      const status = emp.status;
      if (!status) return;
      statuses[status] = (statuses[status] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [allEmployees]);

  // Get hub coordinates
  const cityCoords: Record<string, [number, number]> = {
    'manila': [14.5995, 120.9842],
    'quezon': [14.8291, 121.2558],
    'cebu': [10.3157, 123.8854],
    'davao': [7.0731, 125.6121],
    'cagayan': [17.6412, 121.7740],
    'pampanga': [15.0955, 120.6650],
    'laguna': [14.3159, 121.4158],
    'batangas': [13.7563, 121.0437],
  };

  const getHubCoordinates = (hub: Hub): [number, number] => {
    if (hub.latitude && hub.longitude) {
      return [hub.latitude, hub.longitude];
    }
    const city = hub.city?.toLowerCase() || '';
    for (const [key, coords] of Object.entries(cityCoords)) {
      if (city.includes(key)) {
        return coords;
      }
    }
    return [12.5797, 124.0758];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A]">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col md:flex-row pb-16 md:pb-0">
      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:block w-64 shrink-0 bg-[#111827]">
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          hideThemeToggle={true}
        />
      </div>

      {/* MOBILE HEADER */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#111827] border-b border-gray-800">
        <div className="flex items-center gap-3">
          <img src={logo} alt="3PL Logo" className="h-10 w-auto object-contain" />
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <p className="text-[10px] text-gray-400">3PL BUSINESS SOLUTIONS | Admin overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#C41E3A] flex items-center justify-center font-bold text-sm text-white">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-4 lg:space-y-6">
        
        {/* DESKTOP HEADER */}
        <div className="hidden lg:flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">3PL BUSINESS SOLUTIONS | Admin overview</p>
          </div>
        </div>

        {/* ROW 1: TOTALS */}
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
          <div className="bg-[#1E293B] rounded-xl p-8 flex flex-col items-center justify-center shadow-lg border border-gray-800">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-6 font-semibold">Total Employees</p>
            <p className="text-7xl font-black text-white">{totalEmployees}</p>
          </div>
          <div className="bg-[#1E293B] rounded-xl p-8 flex flex-col items-center justify-center shadow-lg border border-gray-800">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-6 font-semibold">Total Hubs</p>
            <p className="text-7xl font-black text-white">{hubs.length}</p>
          </div>
        </div>

        {/* ROW 2: SMALL CARDS (Status, Employment Type, Workforce) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Employee Status Pie Chart */}
          <div className="bg-[#1E293B] rounded-xl p-5 shadow-lg border border-gray-800">
            <h2 className="text-xs text-gray-300 mb-4">Employee Status</h2>
            {statusData.length > 0 ? (
              <div className="flex items-center gap-6 justify-center">
                <div className="w-28 h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={55}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={index} fill={STATUS_COLORS[entry.name] || '#3B82F6'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-3">
                  {statusData.map((entry, index) => {
                    const total = statusData.reduce((sum, item) => sum + item.value, 0);
                    const percentage = Math.round((entry.value / total) * 100);
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: STATUS_COLORS[entry.name] || '#3B82F6' }}
                          />
                          <span className="text-xs text-gray-400">{entry.name}</span>
                        </div>
                        <span className="text-xs font-bold text-white">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-xs py-4 text-center">No data</p>
            )}
          </div>

          {/* Employment Type Horizontal Bars */}
          <div className="bg-[#1E293B] rounded-xl p-5 shadow-lg border border-gray-800">
            <h2 className="text-xs text-gray-300 mb-4">Employment Type</h2>
            {employmentTypeData.length > 0 ? (
              <div className="space-y-5">
                {employmentTypeData.map((entry, index) => {
                  const maxVal = Math.max(...employmentTypeData.map((d) => d.value), 1);
                  const barPct = (entry.value / maxVal) * 100;
                  return (
                    <div key={index} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-white">{entry.name}</span>
                        <span className="text-sm text-gray-400">{entry.value} ({Math.round((entry.value/totalEmployees)*100)}%)</span>
                      </div>
                      <div className="w-full bg-[#1E3A8A] rounded-full h-5 overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            backgroundColor: EMPLOYMENT_TYPE_COLORS[entry.name] || '#3B82F6',
                            width: `${barPct}%`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-xs py-4 text-center">No data</p>
            )}
          </div>

          {/* Workforce Status */}
          <div className="bg-[#1E293B] rounded-xl p-5 shadow-lg border border-gray-800 flex flex-col">
            <h2 className="text-xs text-gray-300 mb-4">Workforce Status</h2>
            <div className="space-y-4 flex-1 flex flex-col">
              {statusData.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">{item.name}</span>
                  <span className="font-bold text-lg" style={{ color: STATUS_COLORS[item.name] || '#3B82F6' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 3: MAP AND CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Hub Locations Map */}
          <div className="bg-[#1E293B] rounded-xl shadow-lg border border-gray-800 flex flex-col overflow-hidden h-[450px]">
            <div className="p-4 flex items-center justify-between border-b border-gray-800">
              <h2 className="text-base font-bold text-white">Hub Locations</h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Search Locations..." 
                  value={searchLocationTerm}
                  onChange={(e) => setSearchLocationTerm(e.target.value)}
                  className="bg-[#111827] border border-gray-700 text-white text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 w-48"
                />
              </div>
            </div>
            <div className="flex-1 relative z-0">
              <MapContainer 
                center={[12.5797, 124.0758]} 
                zoom={6} 
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
              >
                <FitBoundsComponent mapHubs={hubs} getCoords={getHubCoordinates} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {hubs
                  .filter((hub) => 
                    !searchLocationTerm || 
                    hub.name?.toLowerCase().includes(searchLocationTerm.toLowerCase()) ||
                    hub.location?.toLowerCase().includes(searchLocationTerm.toLowerCase()) ||
                    hub.city?.toLowerCase().includes(searchLocationTerm.toLowerCase())
                  )
                  .map((hub) => {
                    const [lat, lng] = getHubCoordinates(hub);
                    return (
                      <Marker key={hub.id} position={[lat, lng]} icon={hubIcon}>
                        <Popup>
                          <div className="text-xs text-gray-800">
                            <p className="font-bold">{hub.name}</p>
                            <p className="text-gray-600">{hub.location || hub.city}</p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
              </MapContainer>
            </div>
          </div>

          {/* Hub Employee Distribution */}
          <div className="bg-[#1E293B] rounded-xl shadow-lg border border-gray-800 flex flex-col p-5 h-[450px]">
            <h2 className="text-base font-bold text-white mb-6">Hub Employee Distribution</h2>
            <div className="flex-1 overflow-hidden relative">
               <div className="absolute inset-0">
                 {allEmployees.length > 0 ? (
                   <HubsEmployeeChart hubsData={hubs} employees={allEmployees} />
                 ) : (
                   <div className="flex h-full items-center justify-center text-gray-500 text-sm">No data available</div>
                 )}
               </div>
            </div>
          </div>
        </div>

        {/* EMPLOYEES TABLE */}
        <div className="bg-[#1E293B] rounded-xl shadow-lg border border-gray-800 p-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
            <h2 className="text-base font-bold text-white">Employees</h2>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search employees..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#0F172A] border border-gray-700 text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 w-full sm:w-64"
              />
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-800 bg-[#0F172A]">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-[#C41E3A] text-white">
                <tr>
                  <th className="px-5 py-4 font-bold rounded-tl-lg">Name</th>
                  <th className="px-5 py-4 font-bold">Position</th>
                  <th className="px-5 py-4 font-bold">Hub</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold text-center rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-[#0F172A]">
                {employees.slice(0, 10).map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-800/50 text-gray-300">
                    <td className="px-5 py-4 font-medium text-white">{emp.full_name}</td>
                    <td className="px-5 py-4">{emp.position}</td>
                    <td className="px-5 py-4">{emp.hub_name || 'N/A'}</td>
                    <td className="px-5 py-4">
                      <span 
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          emp.status === 'Active' ? 'text-[#10B981] bg-[#10B981]/20' : 
                          emp.status === 'Resign' ? 'text-[#F97316] bg-[#F97316]/20' : 
                          emp.status === 'Blacklist' ? 'text-[#EF4444] bg-[#EF4444]/20' : 'text-[#3B82F6] bg-[#3B82F6]/20'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button 
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setShowEmployeeModal(true);
                        }}
                        className="text-[#3B82F6] hover:text-blue-400 font-bold inline-flex items-center gap-1.5"
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {employees.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-xs">No employees found</div>
            )}
          </div>
        </div>

        {/* HUBS TABLE */}
        <div className="bg-[#1E293B] rounded-xl shadow-lg border border-gray-800 p-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
            <h2 className="text-base font-bold text-white">Hubs</h2>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search Hubs..." 
                value={searchHubTerm}
                onChange={(e) => setSearchHubTerm(e.target.value)}
                className="bg-[#0F172A] border border-gray-700 text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 w-full sm:w-64"
              />
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-800 bg-[#0F172A]">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-[#C41E3A] text-white">
                <tr>
                  <th className="px-5 py-4 font-bold rounded-tl-lg">Hub Name</th>
                  <th className="px-5 py-4 font-bold">Location</th>
                  <th className="px-5 py-4 font-bold rounded-tr-lg">Employees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-[#0F172A]">
                {hubs
                  .filter((hub) =>
                    !searchHubTerm ||
                    hub.name?.toLowerCase().includes(searchHubTerm.toLowerCase()) ||
                    hub.location?.toLowerCase().includes(searchHubTerm.toLowerCase()) ||
                    hub.city?.toLowerCase().includes(searchHubTerm.toLowerCase())
                  )
                  .map((hub) => {
                    const hubEmployeeCount = allEmployees.filter((emp) => emp.hub === hub.id).length;
                    return (
                      <tr key={hub.id} className="hover:bg-gray-800/50 text-gray-300">
                        <td className="px-5 py-4 font-medium text-white">{hub.name}</td>
                        <td className="px-5 py-4">{hub.location || hub.city || 'N/A'}</td>
                        <td className="px-5 py-4 font-bold text-[#EF4444]">{hubEmployeeCount}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {hubs.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-xs">No hubs found</div>
            )}
          </div>
        </div>

      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="lg:hidden">
        <MobileBottomNav />
      </div>

      {/* EMPLOYEE MODAL */}
      {showEmployeeModal && selectedEmployee && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowEmployeeModal(false)}>
          <div className="bg-[#1F2937] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden relative border border-gray-800" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-red-900 to-red-700 p-6 md:p-8 text-white">
              <button 
                onClick={() => setShowEmployeeModal(false)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                <div className="relative shrink-0">
                  {selectedEmployee.profile_image ? (
                    <img 
                      src={selectedEmployee.profile_image} 
                      alt={selectedEmployee.full_name}
                      className="w-24 h-24 rounded-2xl object-cover border-4 border-white/20 shadow-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-white/10 border-4 border-white/20 shadow-xl flex items-center justify-center text-4xl font-extrabold text-white">
                      {selectedEmployee.full_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md text-white border-2 border-red-800 ${
                    selectedEmployee.status?.toLowerCase() === 'active' ? 'bg-green-500' : 'bg-amber-500'
                  }`}>
                    {selectedEmployee.status}
                  </span>
                </div>
                <div className="flex-1 text-center sm:text-left mt-1">
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight">{selectedEmployee.full_name}</h2>
                  <p className="text-red-200 font-medium text-sm md:text-base mt-1">
                    {selectedEmployee.position} • {selectedEmployee.hub_name || 'No Hub Assigned'}
                  </p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-xs mt-3">
                    <span className="px-2.5 py-1 rounded-lg bg-black/20 text-white font-semibold">ID: {selectedEmployee.employee_id || 'N/A'}</span>
                    <span className="px-2.5 py-1 rounded-lg bg-black/20 text-white font-semibold">{selectedEmployee.employment_type || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-[#111827]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Column 1 */}
                <div className="space-y-6">
                  {/* Personal Info */}
                  <div className="bg-[#1F2937] p-5 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-800 mb-4">
                      <User size={16} className="text-red-500" />
                      <h3 className="text-xs font-bold uppercase text-white">Personal Info</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-[10px] text-gray-500 uppercase">First Name</p><p className="text-sm font-semibold text-white">{selectedEmployee.firstname || 'N/A'}</p></div>
                      <div><p className="text-[10px] text-gray-500 uppercase">Last Name</p><p className="text-sm font-semibold text-white">{selectedEmployee.lastname || 'N/A'}</p></div>
                      <div><p className="text-[10px] text-gray-500 uppercase">Gender</p><p className="text-sm font-semibold text-white">{selectedEmployee.gender || 'N/A'}</p></div>
                      <div><p className="text-[10px] text-gray-500 uppercase">Date of Birth</p><p className="text-sm font-semibold text-white">{selectedEmployee.date_of_birth || 'N/A'}</p></div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-[#1F2937] p-5 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-800 mb-4">
                      <Phone size={16} className="text-red-500" />
                      <h3 className="text-xs font-bold uppercase text-white">Contact Info</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><p className="text-[10px] text-gray-500 uppercase">Email</p><p className="text-sm font-semibold text-white break-all">{selectedEmployee.email_address || 'N/A'}</p></div>
                        <div className="col-span-2"><p className="text-[10px] text-gray-500 uppercase">Phone</p><p className="text-sm font-semibold text-white">{selectedEmployee.phone_number || 'N/A'}</p></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-6">
                  {/* Employment Info */}
                  <div className="bg-[#1F2937] p-5 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-800 mb-4">
                      <Briefcase size={16} className="text-red-500" />
                      <h3 className="text-xs font-bold uppercase text-white">Employment Info</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-[10px] text-gray-500 uppercase">Position</p><p className="text-sm font-semibold text-white">{selectedEmployee.position || 'N/A'}</p></div>
                      <div><p className="text-[10px] text-gray-500 uppercase">Hub</p><p className="text-sm font-semibold text-white">{selectedEmployee.hub_name || 'N/A'}</p></div>
                      <div><p className="text-[10px] text-gray-500 uppercase">Hired Date</p><p className="text-sm font-semibold text-white">{selectedEmployee.hired_date || 'N/A'}</p></div>
                      <div><p className="text-[10px] text-gray-500 uppercase">JTP Code</p><p className="text-sm font-semibold text-white">{selectedEmployee.jtp_code || 'N/A'}</p></div>
                    </div>
                  </div>

                  {/* Government IDs */}
                  <div className="bg-[#1F2937] p-5 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-800 mb-4">
                      <Landmark size={16} className="text-red-500" />
                      <h3 className="text-xs font-bold uppercase text-white">Government IDs</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-[10px] text-gray-500 uppercase">TIN</p><p className="text-sm font-semibold text-white">{selectedEmployee.tin || 'N/A'}</p></div>
                      <div><p className="text-[10px] text-gray-500 uppercase">SSS</p><p className="text-sm font-semibold text-white">{selectedEmployee.sss || 'N/A'}</p></div>
                      <div><p className="text-[10px] text-gray-500 uppercase">PhilHealth</p><p className="text-sm font-semibold text-white">{selectedEmployee.philhealth || 'N/A'}</p></div>
                      <div><p className="text-[10px] text-gray-500 uppercase">PAG-IBIG</p><p className="text-sm font-semibold text-white">{selectedEmployee.pagibig || 'N/A'}</p></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
