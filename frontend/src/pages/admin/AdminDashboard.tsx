import { useState, useMemo } from 'react';
import { Card, Badge, Button, LoadingSpinner, ErrorMessage, EmptyState } from '@/components/common';
import { Modal } from '@/components/Modal';
import { useGetEmployees, useGetHubs, useGetAttendance, useGetSecurityAlerts, useGetActivityLogs } from '@/hooks/useQueries';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { Search, Users, MapPin, AlertTriangle, Eye, Trash2, Edit, X, Navigation, Loader } from 'lucide-react';
import { normalizeApiResponse, getApiResponseCount } from '@/utils/apiResponseHandler';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HubsEmployeeChart from '@/components/HubsEmployeeChart';
import { calculateDistance, calculateTravelTime, formatTravelTime, getUserLocation } from '@/utils/locationUtils';
import { Sidebar } from '@/components/Sidebar';
// Color mappings for status
const STATUS_COLORS: Record<string, string> = {
  'Active': '#10B981',      // green
  'AWOL': '#F59E0B',        // yellow
  'Blacklist': '#EF4444',   // red
  'Resign': '#1F2937',      // black
};

const EMPLOYMENT_TYPE_COLORS: Record<string, string> = {
  'Full-time': '#1E40AF',
  'Full time': '#1E40AF',
  OCW: '#3B82F6',
};

export const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { employee } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHubTerm, setSearchHubTerm] = useState('');
  const [hubFilter, setHubFilter] = useState<number | null>(null);
  const [searchLocationTerm, setSearchLocationTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [directions, setDirections] = useState<any>({
    userLocation: null,
    selectedHub: null,
    distance: null,
    travelTimes: null,
    isLoadingLocation: false,
    error: null,
  });


  // Create beautiful custom SVG markers for Leaflet (remove ugly black shadows)
  const hubIcon = L.divIcon({
    className: 'custom-hub-marker',
    html: `
      <div class="relative flex items-center justify-center" style="width: 32px; height: 32px;">
        <div class="absolute w-8 h-8 bg-red-500/30 rounded-full animate-ping"></div>
        <div class="relative w-7 h-7 bg-red-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });

  // Create user location icon
  const userIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div class="relative flex items-center justify-center" style="width: 32px; height: 32px;">
        <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-pulse"></div>
        <div class="relative w-7 h-7 bg-blue-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });

  // Fetch data
  const employeesQuery = useGetEmployees({ hub_id: hubFilter });
  const hubsQuery = useGetHubs();
  const attendanceQuery = useGetAttendance();
  const securityAlertsQuery = useGetSecurityAlerts();
  const activityLogsQuery = useGetActivityLogs({ limit: 5 });

  // Loading state
  const isLoading = employeesQuery.isLoading || hubsQuery.isLoading;

  // Process data
  const employees = useMemo(() => {
    const normalized = normalizeApiResponse(employeesQuery.data);
    return normalized.filter((emp: any) =>
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employeesQuery.data, searchTerm]);

  const hubs = normalizeApiResponse(hubsQuery.data);

  // Calculate stats
  const allEmployees = normalizeApiResponse(employeesQuery.data);
  const totalEmployees = allEmployees.length;
  const activeEmployees = allEmployees.filter((emp: any) => emp.status === 'Active').length;

  // Employment type distribution
  const employmentTypeData = useMemo(() => {
    const types = {} as Record<string, number>;
    allEmployees.forEach((emp: any) => {
      types[emp.employment_type] = (types[emp.employment_type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [allEmployees]);

  // Employee status distribution
  const statusData = useMemo(() => {
    const statuses = {} as Record<string, number>;
    allEmployees.forEach((emp: any) => {
      statuses[emp.status] = (statuses[emp.status] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [allEmployees]);

  // Hub-specific employee distribution with status breakdown
  const hubEmployeeData = useMemo(() => {
    const hubMap = {} as Record<string, { Active: number; AWOL: number; Blacklist: number; Resign: number }>;
    
    allEmployees.forEach((emp: any) => {
      const hubName = emp.hub_name || 'Unknown Hub';
      if (!hubMap[hubName]) {
        hubMap[hubName] = { Active: 0, AWOL: 0, Blacklist: 0, Resign: 0 };
      }
      const status = emp.status || 'Active';
      if (status !== 'Inactive') {
        hubMap[hubName][status as keyof typeof hubMap[string]] = (hubMap[hubName][status as keyof typeof hubMap[string]] || 0) + 1;
      }
    });

    return Object.entries(hubMap)
      .map(([name, statuses]) => ({
        name: name.split(' ').slice(0, 3).join(' '),
        Active: statuses.Active || 0,
        AWOL: statuses.AWOL || 0,
        Blacklist: statuses.Blacklist || 0,
        Resign: statuses.Resign || 0,
      }));
  }, [allEmployees]);

  // Workforce status distribution
  const workforceStatusData = useMemo(() => {
    const positions = {} as Record<string, number>;
    allEmployees.forEach((emp: any) => {
      positions[emp.position] = (positions[emp.position] || 0) + 1;
    });
    return Object.entries(positions).map(([name, value]) => ({ name, count: value }));
  }, [allEmployees]);

  const COLORS = ['#C41E3A', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

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

  const getHubCoordinates = (hub: any): [number, number] => {
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

  // Direction handlers
  const handleMarkerClick = (hub: any) => {
    const coords = getHubCoordinates(hub);
    setDirections((prev: any) => ({
      ...prev,
      selectedHub: { ...hub, coordinates: coords },
      distance: null,
      travelTimes: null,
      error: null,
    }));
  };

  const handleGetDirection = async () => {
    setDirections((prev: any) => ({
      ...prev,
      isLoadingLocation: true,
      error: null,
    }));

    try {
      const userLoc = await getUserLocation();
      const hubCoords = directions.selectedHub.coordinates;
      const dist = calculateDistance(userLoc[0], userLoc[1], hubCoords[0], hubCoords[1]);
      const times = {
        walk: calculateTravelTime(dist, 'walk'),
        ride: calculateTravelTime(dist, 'ride'),
        car: calculateTravelTime(dist, 'car'),
      };

      setDirections((prev: any) => ({
        ...prev,
        userLocation: userLoc,
        distance: dist,
        travelTimes: times,
        isLoadingLocation: false,
      }));
    } catch (error: any) {
      setDirections((prev: any) => ({
        ...prev,
        isLoadingLocation: false,
        error: error.message || 'Failed to get location. Please enable location services.',
      }));
    }
  };

  const handleCloseDirections = () => {
    setDirections({
      userLocation: null,
      selectedHub: null,
      distance: null,
      travelTimes: null,
      isLoadingLocation: false,
      error: null,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:ml-64 flex items-center justify-center min-h-screen">
        <LoadingSpinner />
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {employee?.role === 'HR'
              ? '3PL BUSINESS SOLUTIONS | HR overview'
              : '3PL BUSINESS SOLUTIONS | Admin overview'}
          </p>
        </div>
        
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Employees */}
        <Card className="flex flex-col items-center justify-center p-6 h-44 text-center">
          <p className="text-gray-650 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Employees</p>
          <p className="text-7xl font-black text-red-700 dark:text-red-500 mt-4 leading-none text-center w-full">{totalEmployees}</p>
        </Card>

        {/* Total Hubs */}
        <Card className="flex flex-col items-center justify-center p-6 h-44 text-center">
          <p className="text-gray-650 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Hubs</p>
          <p className="text-7xl font-black text-red-700 dark:text-red-500 mt-4 leading-none text-center w-full">{hubs.length}</p>
        </Card>

        {/* Employee Status Pie Chart with Percentages */}
        <Card className="p-4">
          <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-2">Employee Status</p>
          {statusData.length > 0 ? (
            <div className="flex items-center justify-between">
              <ResponsiveContainer width="60%" height={100}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#3B82F6'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1 text-xs">
                {statusData.map((entry, index) => {
                  const total = statusData.reduce((sum, item) => sum + item.value, 0);
                  const percentage = Math.round((entry.value / total) * 100);
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: STATUS_COLORS[entry.name] || '#3B82F6' }}
                      />
                      <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
                      <span className="font-semibold">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </Card>

        {/* Employment Type Horizontal Bar */}
        <Card className="p-4">
          <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-4">Employment Type</p>
          {employmentTypeData.length > 0 ? (
            <div className="space-y-4">
              {employmentTypeData.map((entry, index) => {
                  const maxVal = Math.max(...employmentTypeData.map((d) => d.value), 1);
                  const barPct = (entry.value / maxVal) * 100;
                  return (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{entry.name}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                      {entry.value} <span className="text-gray-400">({Math.round(barPct)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
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
          ) : null}
        </Card>

        {/* Workforce Status */}
        <Card className="p-4">
          <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-3">Workforce Status</p>
          <div className="space-y-2 text-sm">
            {statusData.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                <span className="font-semibold text-lg" style={{ color: STATUS_COLORS[item.name] }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

        {/* Hub Locations Map & Hub Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hub Locations Map */}
        <Card className="p-0 overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
            <h2 className="text-lg font-semibold">Hub Locations</h2>
            <div className="relative flex-1 max-w-xs ml-4">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search Locations..." 
                value={searchLocationTerm}
                onChange={(e) => setSearchLocationTerm(e.target.value)}
                className="input-field text-sm !pl-10 w-full py-2 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          </div>
          <div className="flex-1 w-full relative z-0 min-h-[400px]">
            {hubs.length > 0 ? (
              <MapContainer 
                center={[12.5797, 124.0758]} 
                zoom={6} 
                style={{ width: '100%', height: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {hubs
                  .filter((hub: any) => 
                    !searchLocationTerm || 
                    hub.name?.toLowerCase().includes(searchLocationTerm.toLowerCase()) ||
                    hub.location?.toLowerCase().includes(searchLocationTerm.toLowerCase()) ||
                    hub.city?.toLowerCase().includes(searchLocationTerm.toLowerCase())
                  )
                  .map((hub: any) => {
                    // Use hub coordinates if available, otherwise use a default based on city
                    let lat = hub.latitude || 12.5797;
                    let lng = hub.longitude || 124.0758;
                    
                    // Default coordinates for Philippine cities
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
                    
                    if (!hub.latitude || !hub.longitude) {
                      const city = hub.city?.toLowerCase() || '';
                      for (const [key, coords] of Object.entries(cityCoords)) {
                        if (city.includes(key)) {
                          lat = coords[0];
                          lng = coords[1];
                          break;
                        }
                      }
                    }

                    return (
                      <Marker key={hub.id} position={[lat, lng]} icon={hubIcon}>
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">{hub.name}</p>
                            <p className="text-gray-600 dark:text-gray-300">{hub.location || hub.city}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {allEmployees.filter((emp: any) => emp.hub === hub.id).length} employees
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
              </MapContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-500">No hubs available to display</p>
              </div>
            )}
          </div>
        </Card>

        {/* Hub Employee Distribution */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Hub Employee Distribution</h2>
          {hubEmployeeData.length > 0 && allEmployees.length > 0 ? (
            <HubsEmployeeChart hubsData={hubs} employees={allEmployees} />
          ) : (
            <EmptyState title="No hub data" />
          )}
        </Card>
      </div>

      {/* Employees Table */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Employees</h2>
            <input 
              type="text" 
              placeholder="Search employees..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field text-sm flex-1 max-w-md"
            />
          </div>

          {employees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-red-700 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Position</th>
                    <th className="px-4 py-3 text-left">Hub</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.slice(0, 10).map((emp: any) => (
                    <tr key={emp.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 font-medium">{emp.full_name}</td>
                      <td className="px-4 py-3">{emp.position}</td>
                      <td className="px-4 py-3">{emp.hub_name || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={emp.status === 'Active' ? 'success' : 'warning'}>
                          {emp.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setShowEmployeeModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1 justify-center"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No employees found" />
          )}
        </div>
      </Card>

      {/* Hubs Table */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Hubs</h2>
            <input 
              type="text" 
              placeholder="Search Hubs..." 
              value={searchHubTerm}
              onChange={(e) => setSearchHubTerm(e.target.value)}
              className="input-field text-sm flex-1 max-w-md"
            />
          </div>

          {hubs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-red-700 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Hub Name</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Employees</th>
                  </tr>
                </thead>
                <tbody>
                  {hubs
                    .filter((hub: any) =>
                      !searchHubTerm ||
                      hub.name?.toLowerCase().includes(searchHubTerm.toLowerCase()) ||
                      hub.location?.toLowerCase().includes(searchHubTerm.toLowerCase()) ||
                      hub.city?.toLowerCase().includes(searchHubTerm.toLowerCase())
                    )
                    .map((hub: any) => {
                      const hubEmployeeCount = allEmployees.filter((emp: any) => emp.hub === hub.id).length;
                      return (
                        <tr key={hub.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 font-medium">{hub.name}</td>
                          <td className="px-4 py-3">{hub.location || hub.city || 'N/A'}</td>
                          <td className="px-4 py-3 font-semibold text-red-700">{hubEmployeeCount}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No hubs found" />
          )}
        </div>
      </Card>

      {/* Employee Details Modal */}
      {showEmployeeModal && selectedEmployee && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={(e) => e.target === e.currentTarget && setShowEmployeeModal(false)}>
          
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative z-[9999]" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-red-700 text-white p-6 flex justify-between items-center z-[10000]">
              <h2 className="text-xl font-bold">Employee Details</h2>
              <button 
                onClick={() => setShowEmployeeModal(false)}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Image */}
              {selectedEmployee.profile_image && (
                <div className="flex justify-center">
                  <img 
                    src={selectedEmployee.profile_image} 
                    alt={selectedEmployee.full_name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-red-700"
                  />
                </div>
              )}

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-700">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">First Name</p>
                    <p className="text-sm font-medium">{selectedEmployee.firstname || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Last Name</p>
                    <p className="text-sm font-medium">{selectedEmployee.lastname || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Middle Initial</p>
                    <p className="text-sm font-medium">{selectedEmployee.middle_initial || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Place of Birth</p>
                    <p className="text-sm font-medium">{selectedEmployee.place_of_birth || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Date of Birth</p>
                    <p className="text-sm font-medium">{selectedEmployee.date_of_birth || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Gender</p>
                    <p className="text-sm font-medium">{selectedEmployee.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Nationality</p>
                    <p className="text-sm font-medium">{selectedEmployee.nationality || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Marital Status</p>
                    <p className="text-sm font-medium">{selectedEmployee.marital_status || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-700">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Email Address</p>
                    <p className="text-sm font-medium">{selectedEmployee.email_address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Phone Number</p>
                    <p className="text-sm font-medium">{selectedEmployee.phone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Current Address</p>
                    <p className="text-sm font-medium">{selectedEmployee.current_address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Permanent Address</p>
                    <p className="text-sm font-medium">{selectedEmployee.permanent_address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Emergency Contact Name</p>
                    <p className="text-sm font-medium">{selectedEmployee.emergency_contact_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Emergency Contact Phone</p>
                    <p className="text-sm font-medium">{selectedEmployee.emergency_contact_phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-700">Employment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Position</p>
                    <p className="text-sm font-medium">{selectedEmployee.position || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Employment Type</p>
                    <p className="text-sm font-medium">{selectedEmployee.employment_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Status</p>
                    <p className="text-sm font-medium">
                      <Badge variant={selectedEmployee.status === 'Active' ? 'success' : 'warning'}>
                        {selectedEmployee.status}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Role</p>
                    <p className="text-sm font-medium">{selectedEmployee.role || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Hub</p>
                    <p className="text-sm font-medium">{selectedEmployee.hub_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Hired Date</p>
                    <p className="text-sm font-medium">{selectedEmployee.hired_date || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Employee ID</p>
                    <p className="text-sm font-medium">{selectedEmployee.employee_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">JTP Code</p>
                    <p className="text-sm font-medium">{selectedEmployee.jtp_code || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Government IDs */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-700">Government IDs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">TIN</p>
                    <p className="text-sm font-medium">{selectedEmployee.tin || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">SSS</p>
                    <p className="text-sm font-medium">{selectedEmployee.sss || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">PhilHealth</p>
                    <p className="text-sm font-medium">{selectedEmployee.philhealth || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">PAG-IBIG</p>
                    <p className="text-sm font-medium">{selectedEmployee.pagibig || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-700">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Can Login</p>
                    <p className="text-sm font-medium">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${selectedEmployee.can_login ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedEmployee.can_login ? 'Yes' : 'No'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Can Edit Info</p>
                    <p className="text-sm font-medium">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${selectedEmployee.can_edit_info ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedEmployee.can_edit_info ? 'Yes' : 'No'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Is Active</p>
                    <p className="text-sm font-medium">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${selectedEmployee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedEmployee.is_active ? 'Yes' : 'No'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Created At</p>
                    <p className="text-sm font-medium">{selectedEmployee.created_at ? new Date(selectedEmployee.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Updated At</p>
                    <p className="text-sm font-medium">{selectedEmployee.updated_at ? new Date(selectedEmployee.updated_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Latest Clock In/Out */}
              {selectedEmployee.latest_clock_in_out && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-red-700">Latest Clock In/Out</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Clock In Time</p>
                      <p className="text-sm font-medium">{selectedEmployee.latest_clock_in_out.clock_in || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Clock Out Time</p>
                      <p className="text-sm font-medium">{selectedEmployee.latest_clock_in_out.clock_out || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t">
                <button 
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
  </div>
  );
};


