  import { useState, useMemo, useEffect, useRef } from 'react';
  import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/common';
  import { useGetHubs, useGetEmployees } from '@/hooks/useQueries';
  import { MapPin, X, Search, BarChart3, Navigation, ChevronLeft, ChevronRight, Users, Clock } from 'lucide-react';
  import { normalizeApiResponse } from '@/utils/apiResponseHandler';
  import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
  import L from 'leaflet';
  import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
  import 'leaflet/dist/leaflet.css';
  import Sidebar from '@/components/Sidebar';

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
      coordinates: [number, number][];
      distance: number; // meters
      duration: number; // seconds
      turns: Array<{
        instruction: string;
        distance: number;
        duration: number;
      }>;
    } | null>(null);
    const [loadingRoute, setLoadingRoute] = useState(false);
    const mapRef = useRef(null);

    const { data, isLoading } = useGetHubs();
    const { data: employeesData } = useGetEmployees();

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

    // Calculate travel times based on distance
    const calculateTravelTimes = (distance: number) => {
      const carSpeed = 40; // km/h average in city
      const walkSpeed = 5; // km/h
      const bikeSpeed = 25; // km/h for "ride" (motorbike)

      return {
        car: Math.round((distance / carSpeed) * 60), // minutes
        walk: Math.round((distance / walkSpeed) * 60), // minutes
        distance: Math.round(distance * 10) / 10, // km with 1 decimal
      };
    };

    // Fetch real route from OSRM (Open Source Routing Machine)
    const fetchRealRoute = async (startLat: number, startLon: number, endLat: number, endLon: number) => {
      setLoadingRoute(true);
      try {
        // OSRM API endpoint - free, no authentication needed
        const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?steps=true&geometries=geojson&overview=full`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          const distanceKm = route.distance / 1000;
          const durationSeconds = route.duration;

          // Extract turn-by-turn instructions
          const turns: Array<{instruction: string; distance: number; duration: number}> = [];
          
          if (route.legs) {
            route.legs.forEach((leg: any) => {
              if (leg.steps) {
                leg.steps.forEach((step: any) => {
                  if (step.maneuver && step.maneuver.instruction) {
                    turns.push({
                      instruction: step.maneuver.instruction,
                      distance: Math.round(step.distance),
                      duration: Math.round(step.duration),
                    });
                  }
                });
              }
            });
          }

          setRouteData({
            coordinates,
            distance: route.distance,
            duration: durationSeconds,
            turns: turns.length > 0 ? turns : [{
              instruction: 'Follow route',
              distance: route.distance,
              duration: durationSeconds,
            }],
          });
          setShowDirections(true);
        }
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
        <div className="p-4 lg:p-6 lg:ml-64 flex items-center justify-center min-h-screen">
          <LoadingSpinner />
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
  />

  <div className="p-4 lg:p-6 lg:ml-64 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Hubs</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{filteredHubs.length} hub locations</p>
          </div>
        </div>

        {/* Search Box */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full max-w-md"
          />
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
                      positions={routeData.coordinates}
                      color="#dc2626"
                      weight={4}
                      opacity={0.8}
                      dashArray="none"
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
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-300 dark:border-blue-700 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-semibold text-sm">
                        <Navigation size={18} className="text-blue-600" />
                        Route Information
                      </div>
                      
                      {/* Main Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        {/* Distance */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-blue-200 dark:border-blue-700">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {(routeData.distance / 1000).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">km</div>
                        </div>
                        
                        {/* Drive Time */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-purple-200 dark:border-purple-700">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {Math.round(routeData.duration / 60)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">min drive</div>
                        </div>
                        
                        {/* Turns */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-orange-200 dark:border-orange-700">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {routeData.turns.length}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">turns</div>
                        </div>
                      </div>

                      {/* Turn-by-Turn Directions */}
                      <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 max-h-48 overflow-y-auto border border-blue-200 dark:border-blue-700">
                        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Directions</h4>
                        <div className="space-y-2">
                          {routeData.turns.map((turn, idx) => (
                            <div key={idx} className="flex gap-2 text-xs text-gray-700 dark:text-gray-300 pb-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs">
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">{turn.instruction}</p>
                                <p className="text-gray-500 dark:text-gray-400">
                                  {(turn.distance / 1000).toFixed(2)} km • {Math.round(turn.duration / 60)} min
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

                  {/* Hub Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Users size={18} className="text-red-600 dark:text-red-400" />
                      </div>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{hubEmployeesData.length}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Employees</p>
                    </div>

                    {employmentTypeData.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center mb-1">
                          <BarChart3 size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{employmentTypeData.length}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Types</p>
                      </div>
                    )}
                  </div>

                  {/* Search Box */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search employee..."
                      value={employeeSearch}
                      onChange={(e) => {
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
                    <div className="text-right">
                      <p className="text-3xl font-bold text-red-700">{employeeCount}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Employees</p>
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
      </>
    );
  };
