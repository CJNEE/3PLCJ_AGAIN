import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/common';
import { useGetHubs, useGetEmployees } from '@/hooks/useQueries';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, X, Navigation, Users, Search, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function HrHubsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'Admin') navigate('/', { replace: true });
  }, [user, navigate]);

  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [hubState, setHubState] = useState<{ selectedHub: any | null }>({ selectedHub: null });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [routeData, setRouteData] = useState<any | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const mapRef = useRef<any>(null);

  const { data, isLoading } = useGetHubs();
  const { data: employeesData } = useGetEmployees();

  const hubs = normalizeApiResponse(data);
  const allEmployees = normalizeApiResponse(employeesData);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
        (err) => console.warn('Geolocation error', err)
      );
    }
  }, []);

  const hubIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const filteredHubs = useMemo(() => {
    return hubs.filter((hub: any) =>
      !searchTerm ||
      hub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hub.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hub.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [hubs, searchTerm]);

  const getHubEmployeeCount = (hubId: number) => allEmployees.filter((emp: any) => emp.hub === hubId).length;

  const hubEmployeesData = useMemo(() => {
    if (!hubState.selectedHub) return [];
    const hubEmployees = allEmployees.filter((emp: any) => emp.hub === hubState.selectedHub.id);
    if (!employeeSearch) return hubEmployees;
    return hubEmployees.filter((emp: any) => (emp.full_name || '').toLowerCase().includes(employeeSearch.toLowerCase()) || (emp.position || '').toLowerCase().includes(employeeSearch.toLowerCase()));
  }, [hubState.selectedHub, employeeSearch, allEmployees]);

  const totalPages = Math.ceil(hubEmployeesData.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return hubEmployeesData.slice(startIdx, startIdx + itemsPerPage);
  }, [hubEmployeesData, currentPage]);

  const employmentTypeData = useMemo(() => {
    const types: Record<string, number> = {};
    hubEmployeesData.forEach((emp: any) => { const type = emp.employment_type || 'Unknown'; types[type] = (types[type] || 0) + 1; });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [hubEmployeesData]);

  const fetchRealRoute = async (startLat: number, startLon: number, endLat: number, endLon: number) => {
    setLoadingRoute(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?steps=true&geometries=geojson&overview=full`;
      const res = await fetch(url);
      const d = await res.json();
      if (d.routes && d.routes.length > 0) {
        const route = d.routes[0];
        const coordinates = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        const turns: any[] = [];
        if (route.legs) {
          route.legs.forEach((leg: any) => leg.steps && leg.steps.forEach((step: any) => {
            turns.push({ instruction: step.maneuver?.instruction || 'Follow', distance: Math.round(step.distance || 0), duration: Math.round(step.duration || 0) });
          }));
        }
        setRouteData({ coordinates, distance: route.distance, duration: route.duration, turns: turns.length ? turns : [{ instruction: 'Follow route', distance: route.distance, duration: route.duration }] });
        setShowDirections(true);
      }
    } catch (err) {
      console.error('Route error', err);
      alert('Could not fetch route');
    } finally { setLoadingRoute(false); }
  };

  const getHubCoordinates = (hub: any): [number, number] => {
    if (hub.latitude && hub.longitude) return [hub.latitude, hub.longitude];
    const city = (hub.city || '').toLowerCase();
    const cityCoords: Record<string, [number, number]> = { 'manila': [14.5995, 120.9842], 'cebu': [10.3157, 123.8854], 'davao': [7.0731, 125.6121] };
    for (const k of Object.keys(cityCoords)) if (city.includes(k)) return cityCoords[k];
    return [12.5797, 124.0758];
  };

  const handleMarkerClick = (hub: any) => { const coords = getHubCoordinates(hub); setHubState({ selectedHub: { ...hub, coordinates: coords } }); setEmployeeSearch(''); setCurrentPage(1); };

  const handleCloseHub = () => { setHubState({ selectedHub: null }); setEmployeeSearch(''); setCurrentPage(1); setShowDirections(false); setRouteData(null); };

  const handleGetDirections = () => { if (userLocation && hubState.selectedHub) { const [hubLat, hubLon] = getHubCoordinates(hubState.selectedHub); const [userLat, userLon] = userLocation; fetchRealRoute(userLat, userLon, hubLat, hubLon); } else { alert('Enable location'); } };

  if (isLoading) return <div className="p-4 lg:p-6 lg:ml-64 flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;

  return (
    <>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="p-4 lg:p-6 lg:ml-64 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Hubs</h1>
            <p className="text-gray-600 text-sm">{filteredHubs.length} hub locations</p>
          </div>
        </div>

        <div className="mb-4">
          <input type="text" placeholder="Search locations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field w-full max-w-md" />
        </div>

        {filteredHubs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 h-[600px]">
            <Card className="lg:col-span-4 p-4 relative">
              <div className="w-full h-full rounded border overflow-hidden">
                <MapContainer center={[12.5797, 124.0758]} zoom={6} style={{ width: '100%', height: '100%' }} ref={mapRef}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                  {userLocation && <Marker position={userLocation} icon={userIcon}><Popup>Your Location</Popup></Marker>}
                  {filteredHubs.map((hub: any) => {
                    const coords = getHubCoordinates(hub);
                    return <Marker key={hub.id} position={coords} icon={hubIcon} eventHandlers={{ click: () => handleMarkerClick(hub) }}><Popup>{hub.name}</Popup></Marker>;
                  })}
                  {showDirections && userLocation && hubState.selectedHub && routeData && <Polyline positions={routeData.coordinates} color="#dc2626" weight={4} opacity={0.8} />}
                </MapContainer>
              </div>
            </Card>

            {hubState.selectedHub && (
              <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col">
                <div className="bg-red-600 p-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2"><MapPin size={18} /><h3 className="font-bold">{hubState.selectedHub.name}</h3></div>
                  <button onClick={handleCloseHub} className="p-1" aria-label="Close"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {showDirections && routeData && (
                    <div className="rounded-lg p-4 border">
                      <div className="flex items-center gap-2 text-sm font-semibold text-blue-700"><Navigation size={16} /> Route</div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="text-center"><div className="text-2xl font-bold">{(routeData.distance/1000).toFixed(2)}</div><div className="text-xs">km</div></div>
                        <div className="text-center"><div className="text-2xl font-bold">{Math.round(routeData.duration/60)}</div><div className="text-xs">min drive</div></div>
                        <div className="text-center"><div className="text-2xl font-bold">{routeData.turns.length}</div><div className="text-xs">turns</div></div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border rounded text-center">
                      <Users size={18} className="mx-auto text-red-600" />
                      <div className="text-2xl font-bold mt-2">{hubEmployeesData.length}</div>
                      <div className="text-xs text-gray-500">Employees</div>
                    </div>

                    <div className="p-3 border rounded text-center">
                      <BarChart3 size={18} className="mx-auto text-blue-600" />
                      <div className="text-2xl font-bold mt-2">{employmentTypeData.length}</div>
                      <div className="text-xs text-gray-500">Types</div>
                    </div>
                  </div>

                  <div>
                    <div className="relative"><Search size={16} className="absolute left-3 top-3 text-gray-400" /><input type="text" placeholder="Search employee..." value={employeeSearch} onChange={(e) => { setEmployeeSearch(e.target.value); setCurrentPage(1); }} className="input-field w-full pl-9 py-2 text-sm" /></div>
                  </div>

                  <div className="overflow-hidden border rounded">
                    <div className="bg-gray-900 text-white px-3 py-2 sticky top-0"><div className="grid grid-cols-12 text-xs font-semibold"><div className="col-span-5">Name</div><div className="col-span-4">Position</div><div className="col-span-3">Status</div></div></div>
                    <div className="max-h-48 overflow-y-auto">
                      {paginatedEmployees.length > 0 ? paginatedEmployees.map((emp: any) => (
                        <div key={emp.id} className="grid grid-cols-12 gap-2 text-xs p-3 border-b hover:bg-gray-100">
                          <div className="col-span-5 font-medium truncate">{emp.full_name}</div>
                          <div className="col-span-4 truncate">{emp.position || 'N/A'}</div>
                          <div className="col-span-3"><Badge variant={emp.status?.toLowerCase()==='active'?'success':'warning'} className="text-xs">{emp.status||'N/A'}</Badge></div>
                        </div>
                      )) : <div className="text-center text-sm text-gray-500 py-6">No employees found</div>}
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-2 border-t pt-3">
                      <button onClick={() => setCurrentPage(Math.max(1, currentPage-1))} className="p-2 rounded bg-gray-200"> <ChevronLeft size={16} /></button>
                      <span className="text-xs">{currentPage} / {totalPages}</span>
                      <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage+1))} className="p-2 rounded bg-gray-200"> <ChevronRight size={16} /></button>
                    </div>
                  )}
                </div>

                <div className="p-3 border-t">
                  <button onClick={handleGetDirections} disabled={loadingRoute} className={`w-full py-3 rounded-lg font-semibold ${loadingRoute? 'bg-yellow-500 text-white':'bg-red-600 text-white'}`}>
                    {loadingRoute ? 'Loading Route...' : showDirections ? 'Directions Shown' : 'Get Directions'}
                  </button>
                </div>
              </Card>
            )}
          </div>
        ) : null}

        {filteredHubs.length > 0 ? (
          <div className="space-y-3">
            {filteredHubs.map((hub: any) => (
              <Card key={hub.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{hub.name}</h3>
                    <p className="text-sm text-gray-600">{hub.location || hub.city}</p>
                    {hub.address && <p className="text-xs text-gray-500 mt-1">{hub.address}</p>}
                  </div>
                  <div className="text-right"><p className="text-3xl font-bold text-red-700">{getHubEmployeeCount(hub.id)}</p><p className="text-xs text-gray-500">Employees</p></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No hubs found" description="Try adjusting your search filters" />
        )}
      </div>
    </>
  );
}
