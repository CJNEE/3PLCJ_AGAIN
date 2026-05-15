import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/common';
import { useGetHubs, useGetEmployees, useCreateHub, useDeleteHub, useUpdateHub } from '@/hooks/useQueries';
import { MapPin, X, Search, Navigation, ChevronLeft, ChevronRight, Users, Footprints, Bike, Car, Plus, Trash2, Edit2 } from 'lucide-react';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import 'leaflet/dist/leaflet.css';
import Sidebar from '@/components/Sidebar';
import { ThemeToggle } from '@/context/ThemeContext';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

export type ParsedOsrmRoute = {
  coordinates: [number, number][];
  distanceM: number;
  durationSec: number;
  turns: Array<{ instruction: string; distance: number; duration: number }>;
  turnCount: number;
};

function parseOsrmResponse(data: any): ParsedOsrmRoute | null {
  if (!data?.routes?.length) return null;
  const route = data.routes[0];
  const coordinates: [number, number][] = route.geometry.coordinates.map(
    (coord: [number, number]) => [coord[1], coord[0]]
  );
  const turns: Array<{ instruction: string; distance: number; duration: number }> = [];
  let turnCount = 0;

  route.legs?.forEach((leg: any) => {
    (leg.steps || []).forEach((step: any) => {
      const instr = step.maneuver?.instruction;
      if (instr) {
        turns.push({
          instruction: instr,
          distance: Math.round(step.distance ?? 0),
          duration: Math.round(step.duration ?? 0),
        });
      }
      const t = step.maneuver?.type;
      if (t && t !== 'depart' && t !== 'arrive') turnCount += 1;
    });
  });

  if (turns.length === 0) {
    turns.push({
      instruction: 'Follow route',
      distance: Math.round(route.distance),
      duration: Math.round(route.duration),
    });
  }

  if (turnCount === 0 && turns.length > 1) {
    turnCount = Math.max(0, turns.length - 1);
  }

  return {
    coordinates,
    distanceM: route.distance,
    durationSec: route.duration,
    turns,
    turnCount,
  };
}

async function fetchOsrmProfile(
  profile: string,
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<ParsedOsrmRoute | null> {
  const url = `${OSRM_BASE}/${profile}/${startLon},${startLat};${endLon},${endLat}?steps=true&geometries=geojson&overview=full`;
  const response = await fetch(url);
  const data = await response.json();
  return parseOsrmResponse(data);
}

  interface HubState {
    selectedHub: any | null;
  }

  export const AdminHubsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [hubState, setHubState] = useState<HubState>({
      selectedHub: null,
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [showDirections, setShowDirections] = useState(false);
    const [routeData, setRouteData] = useState<{
      walking: ParsedOsrmRoute;
      riding: ParsedOsrmRoute;
      car: ParsedOsrmRoute;
    } | null>(null);
    const [loadingRoute, setLoadingRoute] = useState(false);
    const mapRef = useRef(null);

    const { data, isLoading } = useGetHubs();
    const { data: employeesData } = useGetEmployees();
    
    const createHubMutation = useCreateHub();
    const updateHubMutation = useUpdateHub();
    const deleteHubMutation = useDeleteHub();

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingHubId, setEditingHubId] = useState<number | null>(null);
    const [newHub, setNewHub] = useState({ name: '', location: '', city: 'Quezon', address: '', latitude: 14.6760, longitude: 121.0437 });

    const handleAddHub = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (editingHubId) {
          await updateHubMutation.mutateAsync({ id: editingHubId, data: newHub });
        } else {
          await createHubMutation.mutateAsync(newHub);
        }
        setShowAddModal(false);
        setEditingHubId(null);
        setNewHub({ name: '', location: '', city: 'Quezon', address: '', latitude: 14.6760, longitude: 121.0437 });
      } catch (error) {
        console.error("Failed to save hub", error);
        alert("Failed to save hub");
      }
    };

    const handleEditClick = (hub: any, e: any) => {
      e.stopPropagation();
      setEditingHubId(hub.id);
      setNewHub({
        name: hub.name,
        location: hub.location || '',
        city: hub.city || 'Quezon',
        address: hub.address || '',
        latitude: hub.latitude || 14.6760,
        longitude: hub.longitude || 121.0437,
      });
      setShowAddModal(true);
    };

    const handleDeleteHub = async (id: number) => {
      if (window.confirm("Are you sure you want to delete this hub?")) {
        try {
          await deleteHubMutation.mutateAsync(id);
          if (hubState.selectedHub?.id === id) {
            handleCloseHub();
          }
        } catch (error) {
          console.error("Failed to delete hub", error);
          alert("Failed to delete hub");
        }
      }
    };

    const hubs = normalizeApiResponse(data);
    const allEmployees = normalizeApiResponse(employeesData);

    // Get user location on component mount
    useEffect(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation([position.coords.latitude, position.coords.longitude]);
          },
          (error) => console.warn('Geolocation error:', error)
        );
      }
    }, []);

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Fetch walking, riding (cycling), and car routes from OSRM in parallel
    const fetchRealRoute = async (startLat: number, startLon: number, endLat: number, endLon: number) => {
      setLoadingRoute(true);
      try {
        const km = calculateDistance(startLat, startLon, endLat, endLon);
        const line: [number, number][] = [
          [startLat, startLon],
          [endLat, endLon],
        ];
        
        // Accurate fallback speed profiles
        // Walking: 5 km/h
        // Cycling: 15 km/h (standard urban)
        // Car: 35 km/h (assuming urban traffic in PH)
        const makeEstimate = (speedKmh: number, label: string, turns: number = 0): ParsedOsrmRoute => {
          const durationSec = Math.max(60, Math.round((km / speedKmh) * 3600));
          return {
            coordinates: line,
            distanceM: km * 1000,
            durationSec,
            turns: [
              {
                instruction: `${label} (estimated route)`,
                distance: Math.round(km * 1000),
                duration: durationSec,
              },
            ],
            turnCount: Math.max(0, turns),
          };
        };

        const [walkRes, rideRes, carRes] = await Promise.all([
          fetchOsrmProfile('foot', startLat, startLon, endLat, endLon).catch(() => null),
          fetchOsrmProfile('cycling', startLat, startLon, endLat, endLon).catch(() => null),
          fetchOsrmProfile('driving', startLat, startLon, endLat, endLon).catch(() => null),
        ]);

        const walking = walkRes ?? makeEstimate(5, 'Walking', 0);
        const riding = rideRes ?? makeEstimate(15, 'Riding', Math.round(km / 2));
        const car = carRes ?? makeEstimate(35, 'Car', Math.round(km / 1.5));

        setRouteData({ walking, riding, car });
        setShowDirections(true);
      } catch (error) {
        console.error('Error fetching route:', error);
        alert('Could not fetch route. Please try again.');
      } finally {
        setLoadingRoute(false);
      }
    };

    // Create custom red icon for Leaflet
    const hubIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Create user location icon
    const userIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Filter hubs based on search
    const filteredHubs = useMemo(() => {
      return hubs.filter((hub: any) =>
        !searchTerm ||
        hub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hub.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hub.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [hubs, searchTerm]);

    // Get employee count per hub
    const getHubEmployeeCount = (hubId: number) => {
      return allEmployees.filter((emp: any) => emp.hub === hubId).length;
    };

    // Get employees for selected hub
    const hubEmployeesData = useMemo(() => {
      if (!hubState.selectedHub) return [];
      
      const hubEmployees = allEmployees.filter(
        (emp: any) => emp.hub === hubState.selectedHub.id
      );

      if (!employeeSearch) return hubEmployees;

      return hubEmployees.filter((emp: any) =>
        emp.full_name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.position?.toLowerCase().includes(employeeSearch.toLowerCase())
      );
    }, [hubState.selectedHub, employeeSearch, allEmployees]);

    // Pagination
    const totalPages = Math.ceil(hubEmployeesData.length / itemsPerPage);
    const paginatedEmployees = useMemo(() => {
      const startIdx = (currentPage - 1) * itemsPerPage;
      return hubEmployeesData.slice(startIdx, startIdx + itemsPerPage);
    }, [hubEmployeesData, currentPage]);

    // Get employment type distribution for selected hub
    const employmentTypeData = useMemo(() => {
      const types: Record<string, number> = {};
      hubEmployeesData.forEach((emp: any) => {
        const type = emp.employment_type || 'Unknown';
        types[type] = (types[type] || 0) + 1;
      });
      return Object.entries(types).map(([name, value]) => ({ name, value }));
    }, [hubEmployeesData]);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
          <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
          <div className="p-4 lg:p-6 lg:ml-64 flex items-center justify-center min-h-[50vh]">
            <LoadingSpinner />
          </div>
        </div>
      );
    }

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
      return [12.5797, 124.0758]; // Default to center of Philippines
    };

    const handleMarkerClick = (hub: any) => {
      const coords = getHubCoordinates(hub);
      setHubState({
        selectedHub: { ...hub, coordinates: coords },
      });
      setEmployeeSearch('');
      setCurrentPage(1);
    };

    const handleCloseHub = () => {
      setHubState({
        selectedHub: null,
      });
      setEmployeeSearch('');
      setCurrentPage(1);
      setShowDirections(false);
      setRouteData(null);
    };

    const handleGetDirections = () => {
      if (userLocation && hubState.selectedHub) {
        const [hubLat, hubLon] = getHubCoordinates(hubState.selectedHub);
        const [userLat, userLon] = userLocation;
        
        fetchRealRoute(userLat, userLon, hubLat, hubLon);
      } else {
        alert('Unable to get your location. Please enable location services.');
      }
    };

    return (
      <>
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        <div className="p-4 lg:p-6 lg:ml-64 space-y-6">
          {/* Header and Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Hubs</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {filteredHubs.length} hub locations
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-red-600/20 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Plus size={20} />
              Add Hub
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-lg">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              className="input-field w-full pl-11 py-3 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          {/* Transport Modes Info (Floating above map if hub selected) */}
          {showDirections && routeData && (
            <div className="flex justify-center -mb-4 relative z-10">
              <div className="bg-white dark:bg-gray-800 rounded-full px-6 py-2 shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-8">
                <div className="flex flex-col items-center">
                  <Car className="text-gray-900 dark:text-white" size={20} />
                  <span className="text-[10px] font-bold mt-0.5">{formatTravelTime(routeData.car.durationSec)}</span>
                </div>
                <div className="flex flex-col items-center">
                  <Bike className="text-gray-900 dark:text-white" size={20} />
                  <span className="text-[10px] font-bold mt-0.5">{formatTravelTime(routeData.riding.durationSec)}</span>
                </div>
                <div className="flex flex-col items-center">
                  <Footprints className="text-gray-900 dark:text-white" size={20} />
                  <span className="text-[10px] font-bold mt-0.5">{formatTravelTime(routeData.walking.durationSec)}</span>
                </div>
              </div>
            </div>
          )}

        {/* Map and Hub Details Container */}
        {filteredHubs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 h-[600px]">
            {/* Map - Takes 4 columns on desktop, full width on mobile */}
            <Card className="lg:col-span-4 p-0 relative overflow-hidden">
              <div className="w-full h-full">
                <MapContainer
                  center={[12.5797, 124.0758]}
                  zoom={6}
                  style={{ width: '100%', height: '100%' }}
                  ref={mapRef}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* User Location Marker */}
                  {userLocation && (
                    <Marker 
                      position={userLocation}
                      icon={userIcon}
                    >
                      <Popup>Your Location</Popup>
                    </Marker>
                  )}
                  
                  {/* Hub markers */}
                  {filteredHubs.map((hub: any) => {
                    const coords = getHubCoordinates(hub);
                    
                    return (
                      <Marker 
                        key={hub.id} 
                        position={coords} 
                        icon={hubIcon}
                        eventHandlers={{
                          click: () => handleMarkerClick(hub),
                        }}
                      >
                        <Popup>{hub.name}</Popup>
                      </Marker>
                    );
                  })}

                  {/* Polyline from user to selected hub */}
                  {showDirections && userLocation && hubState.selectedHub && routeData && (
                    <Polyline
                      positions={routeData.car.coordinates}
                      color="#dc2626"
                      weight={4}
                      opacity={0.85}
                    />
                  )}
                </MapContainer>
              </div>
            </Card>

            {/* Right Side Panel - Hub Details (Overhauled) */}
            {hubState.selectedHub && (
              <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col bg-white dark:bg-gray-900 border border-red-200 dark:border-gray-800 rounded-2xl shadow-2xl relative">
                {/* Header with Title and Close Button */}
                <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
                    {hubState.selectedHub.name} Employees
                  </h3>
                  <button
                    onClick={handleCloseHub}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"
                  >
                    <X size={22} className="font-bold" />
                  </button>
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Internal Search */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search Name"
                      value={employeeSearch}
                      onChange={(e: any) => {
                        setEmployeeSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="input-field w-full pl-9 py-2 text-sm bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 rounded-full"
                    />
                  </div>

                  {/* Summary Row */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Employment Types */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2.5 border border-gray-100 dark:border-gray-700 text-center">
                      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Employment Types</p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {employmentTypeData.map((type) => (
                          <div key={type.name} className="flex items-center bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                            <span className="text-[9px] font-bold text-blue-700 dark:text-blue-300 mr-1.5">{type.name}</span>
                            <div className="h-1.5 w-10 bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (type.value / hubEmployeesData.length) * 100)}px` }} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total Employees */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2.5 border border-gray-100 dark:border-gray-700 text-center flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Employees</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{hubEmployeesData.length}</p>
                    </div>
                  </div>

                  {/* Employee Table */}
                  <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                    <div className="bg-black text-white px-3 py-2 flex text-[10px] font-black uppercase tracking-widest">
                      <div className="w-[45%]">Name</div>
                      <div className="w-[30%]">Position</div>
                      <div className="w-[25%] text-center">Status</div>
                    </div>
                    
                    <div className="max-h-[250px] overflow-y-auto">
                      {paginatedEmployees.length > 0 ? (
                        paginatedEmployees.map((emp: any) => (
                          <div key={emp.id} className="flex items-center px-3 py-3 border-b border-gray-50 dark:border-gray-800 text-xs hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="w-[45%] font-bold text-gray-900 dark:text-white truncate pr-2">{emp.full_name}</div>
                            <div className="w-[30%] text-gray-500 dark:text-gray-400 truncate pr-2">{emp.position || 'N/A'}</div>
                            <div className="w-[25%] flex justify-center">
                              <div className={`h-2.5 w-full rounded-full ${emp.status?.toLowerCase() === 'active' ? 'bg-green-500' : 'bg-amber-500'}`} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-gray-400 text-xs italic">No employees found</div>
                      )}
                    </div>
                  </div>

                  {/* Pagination and Get Directions */}
                  <div className="pt-2 flex flex-col gap-3">
                    {/* Pagination */}
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="text-gray-400 disabled:opacity-30"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <span className="text-[11px] font-bold text-gray-500">
                        {currentPage} / {totalPages || 1}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="text-gray-400 disabled:opacity-30"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>

                    {/* Get Direction Button */}
                    <button 
                      onClick={handleGetDirections}
                      disabled={loadingRoute}
                      className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold rounded-full text-xs transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      {loadingRoute ? <LoadingSpinner size="sm" /> : 'Get Direction'}
                    </button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : null}

        {/* Hubs List */}
        {filteredHubs.length > 0 ? (
          <div className="space-y-3">
            {filteredHubs.map((hub: any) => {
              const employeeCount = getHubEmployeeCount(hub.id);
              return (
                <Card key={hub.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{hub.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{hub.location || hub.city}</p>
                      {hub.address && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{hub.address}</p>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="flex flex-row gap-2">
                        <button 
                          onClick={(e: any) => handleEditClick(hub, e)}
                          className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                          title="Edit Hub"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={(e: any) => { e.stopPropagation(); handleDeleteHub(hub.id); }}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          title="Delete Hub"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-red-700">{employeeCount}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Employees</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No hubs found" description="Try adjusting your search filters" />
        )}
      </div>

      {/* Add Hub Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">{editingHubId ? 'Edit Hub' : 'Add New Hub'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingHubId(null); setNewHub({ name: '', location: '', city: 'Quezon', address: '', latitude: 14.6760, longitude: 121.0437 }); }} className="hover:bg-red-800 p-1 rounded transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <form id="add-hub-form" onSubmit={handleAddHub} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hub Name</label>
                  <input required type="text" value={newHub.name} onChange={(e: any) => setNewHub({...newHub, name: e.target.value})} className="input-field w-full" placeholder="e.g. Quezon Hub 1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <input required type="text" value={newHub.location} onChange={(e: any) => setNewHub({...newHub, location: e.target.value})} className="input-field w-full" placeholder="e.g. Novaliches" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input required type="text" value={newHub.city} onChange={(e: any) => setNewHub({...newHub, city: e.target.value})} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                  <input required type="text" value={newHub.address} onChange={(e: any) => setNewHub({...newHub, address: e.target.value})} className="input-field w-full" placeholder="Full address" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
                    <input required type="number" step="any" value={newHub.latitude} onChange={(e: any) => setNewHub({...newHub, latitude: parseFloat(e.target.value)})} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
                    <input required type="number" step="any" value={newHub.longitude} onChange={(e: any) => setNewHub({...newHub, longitude: parseFloat(e.target.value)})} className="input-field w-full" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900">
                  <button type="button" onClick={() => { setShowAddModal(false); setEditingHubId(null); setNewHub({ name: '', location: '', city: 'Quezon', address: '', latitude: 14.6760, longitude: 121.0437 }); }} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                    Cancel
                  </button>
                  <button type="submit" form="add-hub-form" disabled={createHubMutation.isPending || updateHubMutation.isPending} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                    {(createHubMutation.isPending || updateHubMutation.isPending) && <LoadingSpinner size="sm" />}
                    {editingHubId ? 'Save Changes' : 'Add Hub'}
                  </button>
            </div>
          </div>
        </div>
      )}
      </>
    );
  };

