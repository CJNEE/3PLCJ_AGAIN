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
        const makeEstimate = (speedKmh: number, label: string): ParsedOsrmRoute => {
          const durationSec = Math.max(60, Math.round((km / speedKmh) * 3600));
          return {
            coordinates: line,
            distanceM: km * 1000,
            durationSec,
            turns: [
              {
                instruction: `${label} (straight-line estimate)`,
                distance: Math.round(km * 1000),
                duration: durationSec,
              },
            ],
            turnCount: 0,
          };
        };

        const [walkRes, rideRes, carRes] = await Promise.all([
          fetchOsrmProfile('foot', startLat, startLon, endLat, endLon).catch(() => null),
          fetchOsrmProfile('cycling', startLat, startLon, endLat, endLon).catch(() => null),
          fetchOsrmProfile('driving', startLat, startLon, endLat, endLon).catch(() => null),
        ]);

        const walking = walkRes ?? makeEstimate(5, 'Walking');
        const riding = rideRes ?? makeEstimate(22, 'Riding');
        const car = carRes ?? makeEstimate(40, 'Car');

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
          <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} hideThemeToggle />
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
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          hideThemeToggle
        />

        <div className="p-4 lg:p-6 lg:ml-64 space-y-6">
          {/* Header + theme (top-right) */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Hubs</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{filteredHubs.length} hub locations</p>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:pt-0.5">
              <ThemeToggle />
            </div>
          </div>

          {/* Search and Add Hub */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              className="input-field w-full max-w-md"
            />
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Add Hub
            </button>
          </div>

        {/* Map and Hub Details Container */}
        {filteredHubs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 h-[600px]">
            {/* Map - Takes 3 columns on desktop */}
            <Card className="lg:col-span-4 p-4 relative">

              <div className="w-full h-full rounded border border-gray-200 overflow-hidden">
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

            {/* Right Side Panel - Hub Details */}
            {hubState.selectedHub && (
              <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col bg-white dark:bg-gray-900 border-2 border-red-600">
                {/* Header with close button */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 text-white flex items-center justify-between flex-shrink-0 shadow-md">
                  <div className="flex items-center gap-2">
                    <MapPin size={20} className="flex-shrink-0" />
                    <h3 className="font-bold text-base">{hubState.selectedHub.name}</h3>
                  </div>
                  <button
                    onClick={handleCloseHub}
                    className="p-1 hover:bg-red-800 rounded transition-colors"
                    aria-label="Close hub details"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Directions Info - Show when directions are enabled */}
                  {showDirections && routeData && (
                    <div className="rounded-xl border border-slate-200/90 dark:border-slate-600/90 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/60 dark:to-slate-900/30 p-4 space-y-4 shadow-sm">
                      <div className="flex items-start gap-2">
                        <Navigation className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                            Route information
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            Distances and times from OSRM (OpenStreetMap). Map line follows driving route.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {(
                          [
                            { label: 'Walking', Icon: Footprints, r: routeData.walking, bar: 'from-emerald-600 to-teal-600' },
                            { label: 'Riding', Icon: Bike, r: routeData.riding, bar: 'from-amber-500 to-orange-600' },
                            { label: 'Car', Icon: Car, r: routeData.car, bar: 'from-red-600 to-rose-700' },
                          ] as const
                        ).map(({ label, Icon, r, bar }) => (
                          <div
                            key={label}
                            className="rounded-lg border border-slate-200/80 dark:border-slate-600 bg-white/90 dark:bg-slate-800/90 overflow-hidden shadow-sm"
                          >
                            <div className={`h-1 bg-gradient-to-r ${bar}`} />
                            <div className="p-3.5">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200">
                                  <Icon size={16} strokeWidth={2} />
                                </span>
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-md bg-slate-50 dark:bg-slate-900/50 px-2 py-2.5 text-center border border-slate-100 dark:border-slate-700">
                                  <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-white leading-none">
                                    {(r.distanceM / 1000).toFixed(2)}
                                  </div>
                                  <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-1">
                                    km
                                  </div>
                                </div>
                                <div className="rounded-md bg-slate-50 dark:bg-slate-900/50 px-2 py-2.5 text-center border border-slate-100 dark:border-slate-700">
                                  <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-white leading-none">
                                    {Math.max(1, Math.round(r.durationSec / 60))}
                                  </div>
                                  <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-1">
                                    min
                                  </div>
                                </div>
                                <div className="rounded-md bg-slate-50 dark:bg-slate-900/50 px-2 py-2.5 text-center border border-slate-100 dark:border-slate-700">
                                  <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-white leading-none">
                                    {r.turnCount}
                                  </div>
                                  <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-1">
                                    turns
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-800/60 p-3 max-h-44 overflow-y-auto">
                        <h5 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                          Driving directions
                        </h5>
                        <div className="space-y-2">
                          {routeData.car.turns.map((turn: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex gap-2 text-xs text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0"
                            >
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50 text-[11px] font-semibold text-red-700 dark:text-red-300">
                                {idx + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-900 dark:text-white leading-snug">{turn.instruction}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  {(turn.distance / 1000).toFixed(2)} km · {Math.max(0, Math.round(turn.duration / 60))} min
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {loadingRoute && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin">⚙️</div>
                        <span className="text-yellow-900 dark:text-yellow-200 font-semibold">Calculating route...</span>
                      </div>
                    </div>
                  )}

                  {/* Hub stats */}
                  <div className="rounded-xl border border-red-200/80 dark:border-red-900/50 bg-gradient-to-br from-red-50/90 to-white dark:from-red-950/30 dark:to-slate-900/40 p-4 text-center shadow-sm">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                      <Users size={20} className="text-red-700 dark:text-red-300" />
                    </div>
                    <p className="text-3xl font-bold tabular-nums text-red-700 dark:text-red-300">{hubEmployeesData.length}</p>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400 mt-1">
                      Employees at this hub
                    </p>
                  </div>

                  {/* Search Box */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search employee..."
                      value={employeeSearch}
                      onChange={(e: any) => {
                        setEmployeeSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="input-field w-full pl-9 py-2 text-sm"
                    />
                  </div>

                  {/* Employment Types Chart - Compact */}
                  {employmentTypeData.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Employment Distribution</h4>
                      <ResponsiveContainer width="100%" height={60}>
                        <BarChart data={employmentTypeData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 9 }} />
                          <Tooltip contentStyle={{ fontSize: 11 }} />
                          <Bar dataKey="value" fill="#EF4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Employees List */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="bg-gray-900 dark:bg-gray-950 text-white px-3 py-2 sticky top-0">
                      <div className="grid grid-cols-12 gap-2 text-xs font-semibold">
                        <div className="col-span-5">Name</div>
                        <div className="col-span-4">Position</div>
                        <div className="col-span-3">Status</div>
                      </div>
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto">
                      {paginatedEmployees.length > 0 ? (
                        paginatedEmployees.map((emp: any) => (
                          <div key={emp.id} className="grid grid-cols-12 gap-2 text-xs p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="col-span-5 font-medium text-gray-900 dark:text-white truncate">{emp.full_name}</div>
                            <div className="col-span-4 text-gray-600 dark:text-gray-400 truncate">{emp.position || 'N/A'}</div>
                            <div className="col-span-3">
                              <Badge variant={emp.status?.toLowerCase() === 'active' ? 'success' : 'warning'} className="text-xs">
                                {emp.status || 'N/A'}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
                          No employees found
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous page"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-16 text-center">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next page"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Get Direction Button - At bottom */}
                <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/20 border-t-2 border-red-200 dark:border-red-800 p-3 flex-shrink-0">
                  <button 
                    onClick={handleGetDirections}
                    disabled={loadingRoute}
                    className={`w-full font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 disabled:scale-100 disabled:opacity-75 ${
                      loadingRoute
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg'
                        : showDirections
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                        : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md'
                    }`}
                  >
                    <Navigation size={18} />
                    {loadingRoute 
                      ? 'Loading Route...' 
                      : showDirections 
                      ? 'Directions Shown' 
                      : 'Get Directions'}
                  </button>
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
