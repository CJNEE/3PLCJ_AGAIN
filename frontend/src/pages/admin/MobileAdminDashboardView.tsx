import React from 'react';
import { Card, Badge, EmptyState } from '@/components/common';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Search, MapPin, Users, ChevronDown, User, LogOut, Home, FileText, Plus, Sun, Moon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HubsEmployeeChart from '@/components/HubsEmployeeChart';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';

// Shared Colors from AdminDashboard
const STATUS_COLORS: Record<string, string> = {
  'Active': '#10B981',      
  'AWOL': '#ff4d00',        
  'Blacklist': '#ff0000',   
  'Resign': '#454545',      
};

const EMPLOYMENT_TYPE_COLORS: Record<string, string> = {
  'Full-time': '#1E40AF',
  'Full time': '#1E40AF',
  OCW: '#3B82F6',
};

const getHubCoordinates = (hub: any): [number, number] => {
  if (hub.latitude && hub.longitude && !isNaN(hub.latitude) && !isNaN(hub.longitude)) {
    return [Number(hub.latitude), Number(hub.longitude)];
  }
  const city = (hub.city || hub.location || '').toLowerCase();
  const coords: Record<string, [number, number]> = {
    manila: [14.5995, 120.9842], cebu: [10.3157, 123.8854], davao: [7.1907, 125.4553],
    quezon: [14.6760, 121.0437], makati: [14.5547, 121.0244], lucena: [13.9314, 121.6172],
    candelaria: [13.9283, 121.4239],
  };
  for (const [key, val] of Object.entries(coords)) {
    if (city.includes(key)) return val;
  }
  return [12.8797, 121.774];
};

const FitBoundsComponent = ({ mapHubs, getCoords }: { mapHubs: any[], getCoords: (hub: any) => [number, number] }) => {
  const map = useMap();
  React.useEffect(() => {
    if (!mapHubs?.length) return;
    const bounds = L.latLngBounds(mapHubs.map((hub) => getCoords(hub)));
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
  }, [map, mapHubs, getCoords]);
  return null;
};

export const MobileAdminDashboardView = ({
  employee,
  employees,
  hubs,
  allEmployees,
  totalEmployees,
  statusData,
  employmentTypeData,
  hubEmployeeData,
  searchTerm, setSearchTerm,
  searchHubTerm, setSearchHubTerm,
  searchLocationTerm, setSearchLocationTerm,
  setSelectedEmployee, setShowEmployeeModal
}: any) => {

  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [showMapSearch, setShowMapSearch] = React.useState(false);

  const filteredHubs = React.useMemo(() => {
    return hubs.filter(
      (hub: any) =>
        !searchLocationTerm ||
        hub.name?.toLowerCase().includes(searchLocationTerm.toLowerCase()) ||
        hub.location?.toLowerCase().includes(searchLocationTerm.toLowerCase()) ||
        hub.city?.toLowerCase().includes(searchLocationTerm.toLowerCase())
    );
  }, [hubs, searchLocationTerm]);

  const modernMarker = L.divIcon({
    className: 'custom-modern-marker',
    html: `
      <div style="position:relative; width:16px; height:16px;">
        <div style="position:absolute; inset:0; border-radius:999px; background:#ef4444; border:3px solid white; box-shadow: 0 0 0 4px rgba(239,68,68,0.15), 0 4px 12px rgba(239,68,68,0.25);"></div>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });

  return (
    <div className="min-h-screen bg-[#0B1120] text-gray-200 pb-24 font-sans selection:bg-blue-500/30">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Top Header */}
      <div className="flex justify-between items-center p-5 pt-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">3PL BUSINESS SOLUTIONS | Admin overview</p>
        </div>
        <div 
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          className="relative flex items-center gap-2 bg-[#111827] px-3 py-1.5 rounded-full border border-gray-800 cursor-pointer active:bg-gray-800 transition-all select-none"
        >
          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-gray-300" />
          </div>
          <span className="text-xs font-medium text-gray-300">Admin</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />

          {showProfileDropdown && (
            <div className="absolute right-0 top-full mt-2 w-36 bg-[#111827] border border-gray-800 rounded-xl shadow-xl p-1 z-[9999]">
              <div className="px-3 py-1.5 border-b border-gray-800 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                Admin Panel
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDarkMode();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 hover:bg-gray-700/50 active:bg-gray-700 rounded-lg transition-colors"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-yellow-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 active:bg-red-500/20 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">
        
        {/* Top Cards Row */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-[#111827] border-gray-800 p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Total Employees</p>
              <p className="text-3xl font-bold text-white">{totalEmployees}</p>
            </div>
          </Card>

          <Card className="bg-[#111827] border-gray-800 p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Total Hubs</p>
              <p className="text-3xl font-bold text-white">{hubs.length}</p>
            </div>
          </Card>
        </div>

        {/* Stats Section (Employee Status, Employment Type, Workforce Status) */}
        {/* Scrollable horizontally to match the 3-column feel without squashing */}
        <div className="flex overflow-x-auto pb-2 -mx-4 px-4 gap-4 snap-x hide-scrollbar">
          
          {/* Employee Status */}
          <Card className="bg-[#111827] border-gray-800 p-4 min-w-[280px] snap-center flex flex-col">
            <h3 className="text-sm font-semibold text-white mb-4">Employee Status</h3>
            <div className="flex items-center gap-4 flex-1">
              <div className="w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} dataKey="value" stroke="none">
                      {statusData.map((entry: any, index: number) => (
                        <Cell key={index} fill={STATUS_COLORS[entry.name] || '#3B82F6'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {statusData.map((entry: any, idx: number) => {
                  const pct = Math.round((entry.value / totalEmployees) * 100);
                  return (
                    <div key={idx} className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.name] }} />
                        <span className="text-gray-400">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{pct}%</span>
                        <span className="text-gray-500">({entry.value})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Employment Type */}
          <Card className="bg-[#111827] border-gray-800 p-4 min-w-[280px] snap-center flex flex-col">
            <h3 className="text-sm font-semibold text-white mb-4">Employment Type</h3>
            <div className="space-y-4 flex-1 mt-2">
              {employmentTypeData.map((entry: any, idx: number) => {
                const pct = Math.round((entry.value / totalEmployees) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-300 font-medium">{entry.name}</span>
                      <div className="flex gap-2">
                        <span className="text-white">{entry.value}</span>
                        <span className="text-gray-500">({pct}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: EMPLOYMENT_TYPE_COLORS[entry.name] || '#3B82F6' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Workforce Status */}
          <Card className="bg-[#111827] border-gray-800 p-4 min-w-[280px] snap-center flex flex-col">
            <h3 className="text-sm font-semibold text-white mb-4">Workforce Status</h3>
            <div className="space-y-3 flex-1 mt-1">
              {statusData.map((entry: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center relative pl-3">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.name] }} />
                  <span className="text-[11px] text-gray-400">{entry.name}</span>
                  <span className="text-[11px] font-semibold" style={{ color: STATUS_COLORS[entry.name] }}>{entry.value}</span>
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* Map */}
        <Card className="bg-[#111827] border-gray-800 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 z-[1000] flex justify-between items-center p-4 bg-gradient-to-b from-[#111827] to-transparent pointer-events-none">
            {showMapSearch ? (
              <div className="flex items-center gap-2 w-full pointer-events-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    className="w-full bg-[#111827]/95 border border-gray-800 rounded-full py-1.5 pl-8 pr-3 text-[10px] text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-700"
                    value={searchLocationTerm}
                    onChange={e => setSearchLocationTerm(e.target.value)}
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => {
                    setShowMapSearch(false);
                    setSearchLocationTerm('');
                  }}
                  className="text-[10px] font-semibold text-blue-400 px-2 py-1 bg-gray-800/80 rounded-md border border-gray-700 active:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 pointer-events-auto">
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Hub Locations</h3>
                    <p className="text-[9px] text-gray-400">Live hub overview</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMapSearch(true)}
                  className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center pointer-events-auto border border-gray-700 hover:bg-gray-700 active:bg-gray-600 transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </>
            )}
          </div>
          
          <div className="h-[250px] w-full bg-[#0B1120]">
            <MapContainer center={[12.8797, 121.774]} zoom={5} zoomControl={false} attributionControl={false} style={{ width: '100%', height: '100%', background: '#0B1120' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              <FitBoundsComponent mapHubs={filteredHubs} getCoords={getHubCoordinates} />
              {filteredHubs.map((hub: any) => {
                const [lat, lng] = getHubCoordinates(hub);
                return (
                  <Marker key={hub.id} position={[lat, lng]} icon={modernMarker}>
                    <Popup closeButton={false}>
                      <div className="text-xs font-semibold">{hub.name}</div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </Card>

        {/* Hub Employee Distribution Chart */}
        <Card className="bg-[#111827] border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700">
              <Users className="w-4 h-4 text-gray-300" />
            </div>
            <h3 className="text-sm font-semibold text-white">Hub Employee Distribution</h3>
          </div>

          {/* Fixed Legend */}
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#22C55E]"></div><span className="text-[10px] text-gray-400">Active</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]"></div><span className="text-[10px] text-gray-400">AWOL</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#6B7280]"></div><span className="text-[10px] text-gray-400">Resign</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]"></div><span className="text-[10px] text-gray-400">Blacklist</span></div>
          </div>
          
          <div className="h-[220px] w-full overflow-x-auto hide-scrollbar">
            {hubEmployeeData.length > 0 ? (
               <HubsEmployeeChart hubsData={hubs} employees={allEmployees} />
            ) : (
              <EmptyState title="No data" />
            )}
          </div>

          <div className="mt-4 p-3 rounded-lg border border-gray-800 bg-gray-800/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gray-800 flex items-center justify-center shrink-0 border border-gray-700">
              <div className="flex gap-0.5 items-end h-3.5">
                <div className="w-1 h-2 bg-gray-500 rounded-sm"></div>
                <div className="w-1 h-3.5 bg-gray-300 rounded-sm"></div>
                <div className="w-1 h-1.5 bg-gray-500 rounded-sm"></div>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              <span className="text-white font-medium">{hubEmployeeData.length > 0 ? hubEmployeeData.reduce((prev: any, current: any) => (prev.Active > current.Active) ? prev : current).name : 'No'} Hub</span> has the highest number of active employees.
            </p>
          </div>
        </Card>

        {/* Employees Table */}
        <Card className="bg-[#111827] border-gray-800 overflow-hidden flex flex-col">
          <div className="p-4 flex justify-between items-center border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">Employees</h3>
            <div className="relative w-36">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input type="text" placeholder="Search employees..." className="w-full bg-[#0B1120] border border-gray-800 rounded-full py-1.5 pl-8 pr-3 text-[10px] text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-700" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] whitespace-nowrap">
              <thead className="bg-gray-800/60 text-gray-300 uppercase text-[9px] tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Position</th>
                  <th className="px-4 py-2.5 font-medium">Hub</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {employees.slice(0, 10).map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-200">{emp.full_name}</td>
                    <td className="px-4 py-3 text-gray-400">{emp.position}</td>
                    <td className="px-4 py-3 text-gray-400">{emp.hub_name || 'N/A'}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: STATUS_COLORS[emp.status] }}>{emp.status}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => { setSelectedEmployee(emp); setShowEmployeeModal(true); }} className="px-3.5 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-semibold border border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-300 transition-all duration-200">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-gray-800 text-center">
            <button onClick={() => navigate('/admin/employees')} className="text-[11px] text-gray-400 hover:text-white transition-colors">View all employees &gt;</button>
          </div>
        </Card>

        {/* Hubs Table */}
        <Card className="bg-[#111827] border-gray-800 overflow-hidden flex flex-col mb-6">
          <div className="p-4 flex justify-between items-center border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">Hubs</h3>
            <div className="relative w-36">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input type="text" placeholder="Search hubs..." className="w-full bg-[#0B1120] border border-gray-800 rounded-full py-1.5 pl-8 pr-3 text-[10px] text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-700" value={searchHubTerm} onChange={e => setSearchHubTerm(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] whitespace-nowrap">
              <thead className="bg-gray-800/60 text-gray-300 uppercase text-[9px] tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Hub Name</th>
                  <th className="px-4 py-2.5 font-medium">Location</th>
                  <th className="px-4 py-2.5 font-medium text-center">Employees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {hubs
                  .filter((hub: any) =>
                    !searchHubTerm ||
                    hub.name?.toLowerCase().includes(searchHubTerm.toLowerCase()) ||
                    hub.location?.toLowerCase().includes(searchHubTerm.toLowerCase()) ||
                    hub.city?.toLowerCase().includes(searchHubTerm.toLowerCase())
                  )
                  .slice(0, 10)
                  .map((hub: any) => {
                    const cnt = allEmployees.filter((emp: any) => emp.hub === hub.id).length;
                    return (
                      <tr key={hub.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-gray-200">{hub.name}</td>
                        <td className="px-4 py-3 text-gray-400">{hub.location || hub.city || 'N/A'}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-500 text-center">{cnt}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-gray-800 text-center">
            <button onClick={() => navigate('/admin/hubs')} className="text-[11px] text-gray-400 hover:text-white transition-colors">View all hubs &gt;</button>
          </div>
        </Card>

      </div>

      {/* Floating Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#0B1120] border-t border-gray-800 flex justify-around items-center px-2 z-[9000]">
        <div onClick={() => navigate('/admin')} className="flex flex-col items-center justify-center w-16 gap-1 cursor-pointer">
          <Home className="w-5 h-5 text-blue-500" />
          <span className="text-[9px] text-blue-500 font-medium">Dashboard</span>
        </div>
        <div onClick={() => navigate('/admin/hubs')} className="flex flex-col items-center justify-center w-16 gap-1 cursor-pointer">
          <MapPin className="w-5 h-5 text-gray-500" />
          <span className="text-[9px] text-gray-500">Hubs</span>
        </div>
        <div className="relative -top-5">
          <div onClick={() => navigate('/admin/employees')} className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] cursor-pointer">
            <Plus className="w-6 h-6 text-white" />
          </div>
        </div>
        <div onClick={() => navigate('/admin/employees')} className="flex flex-col items-center justify-center w-16 gap-1 cursor-pointer">
          <Users className="w-5 h-5 text-gray-500" />
          <span className="text-[9px] text-gray-500">Employees</span>
        </div>
        <div onClick={() => navigate('/admin/edit-requests')} className="flex flex-col items-center justify-center w-16 gap-1 cursor-pointer">
          <FileText className="w-5 h-5 text-gray-500" />
          <span className="text-[9px] text-gray-500">Edit</span>
        </div>
      </div>

    </div>
  );
};
