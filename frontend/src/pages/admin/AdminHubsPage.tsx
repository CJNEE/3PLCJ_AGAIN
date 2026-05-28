import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, LoadingSpinner } from '@/components/common';
import { GlassCard } from '@/components/GlassCard';
import {
useGetHubs,
useGetEmployees,
useCreateHub,
useDeleteHub,
useUpdateHub
} from '@/hooks/useQueries';

import {
MapPin,
X,
Search,
Navigation,
ChevronLeft,
ChevronRight,
Footprints,
Bike,
Car,
Plus,
Route,
Shield,
Building2,
CloudSun
} from 'lucide-react';

import { normalizeApiResponse } from '@/utils/apiResponseHandler';

import {
MapContainer,
TileLayer,
Marker,
Polyline,
Popup
} from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import Sidebar from '@/components/Sidebar';
import { fetchWeather } from '@/utils/weather';
import { useAuth } from '@/hooks/useAuth';

const OSRM_BASE = '[https://router.project-osrm.org/route/v1](https://router.project-osrm.org/route/v1)';

function estimateDuration(distanceM: number, mode: 'walk' | 'bike' | 'car') {
const km = distanceM / 1000;

const speeds = {
walk: 4.8,
bike: 14,
car: 38,
};

const hours = km / speeds[mode];

return Math.round(hours * 3600);
}

function parseOsrmResponse(data: any, mode: 'walk' | 'bike' | 'car') {
if (!data?.routes?.length) return null;

const route = data.routes[0];

return {
coordinates: route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]),
distanceM: route.distance,
durationSec: estimateDuration(route.distance, mode),
};
}

async function fetchOsrmProfile(
profile: string,
mode: 'walk' | 'bike' | 'car',
startLat: number,
startLon: number,
endLat: number,
endLon: number
) {
const url = `${OSRM_BASE}/${profile}/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;

const res = await fetch(url);
const data = await res.json();

return parseOsrmResponse(data, mode);
}

function formatDistance(meters: number) {
return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number) {
const mins = Math.round(seconds / 60);

if (mins < 60) return `${mins} mins`;

const hrs = Math.floor(mins / 60);
const rem = mins % 60;

return `${hrs}h ${rem}m`;
}

export const AdminHubsPage = () => {
const { canViewEmployees } = useAuth();

const mapRef = useRef(null);

const [sidebarOpen, setSidebarOpen] = useState(false);
const [searchTerm, setSearchTerm] = useState('');
const [employeeSearch, setEmployeeSearch] = useState('');
const [selectedHub, setSelectedHub] = useState<any | null>(null);
const [routeData, setRouteData] = useState<any>(null);
const [showDirections, setShowDirections] = useState(false);
const [loadingRoute, setLoadingRoute] = useState(false);
const [weatherData, setWeatherData] = useState<any>(null);
const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

const { data, isLoading } = useGetHubs();
const { data: employeesData } = useGetEmployees();

useCreateHub();
useDeleteHub();
useUpdateHub();

const hubs = normalizeApiResponse(data);
const allEmployees = normalizeApiResponse(employeesData);

useEffect(() => {
navigator.geolocation?.getCurrentPosition((position) => {
setUserLocation([
position.coords.latitude,
position.coords.longitude,
]);
});
}, []);

const getHubCoordinates = (hub: any): [number, number] => {
return [hub.latitude || 14.676, hub.longitude || 121.0437];
};

useEffect(() => {
async function loadWeather() {
if (!selectedHub) return;

```
  const coords = getHubCoordinates(selectedHub);
  const weather = await fetchWeather(coords[0], coords[1]);
  setWeatherData(weather);
}

loadWeather();
```

}, [selectedHub]);

const filteredHubs = useMemo(() => {
return hubs.filter((hub: any) => {
return (
hub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
hub.city?.toLowerCase().includes(searchTerm.toLowerCase())
);
});
}, [searchTerm, hubs]);

const hubEmployees = useMemo(() => {
if (!selectedHub) return [];

```
return allEmployees.filter((emp: any) => {
  return emp.hub === selectedHub.id;
});
```

}, [selectedHub, allEmployees]);

const fetchRoute = async () => {
if (!userLocation || !selectedHub) return;

```
setLoadingRoute(true);

const coords = getHubCoordinates(selectedHub);

try {
  const [walking, riding, car] = await Promise.all([
    fetchOsrmProfile('foot', 'walk', userLocation[0], userLocation[1], coords[0], coords[1]),
    fetchOsrmProfile('cycling', 'bike', userLocation[0], userLocation[1], coords[0], coords[1]),
    fetchOsrmProfile('driving', 'car', userLocation[0], userLocation[1], coords[0], coords[1]),
  ]);

  setRouteData({ walking, riding, car });
  setShowDirections(true);
} catch (err) {
  console.error(err);
} finally {
  setLoadingRoute(false);
}
```

};

const hubIcon = useMemo(() => L.divIcon({
className: '',
html: `<div style="width:20px;height:20px;background:#ef4444;border-radius:999px;border:4px solid white;box-shadow:0 6px 18px rgba(0,0,0,.18)"></div>`,
iconSize: [20, 20],
}), []);

const userIcon = useMemo(() => L.divIcon({
className: '',
html: `<div style="width:20px;height:20px;background:#2563eb;border-radius:999px;border:4px solid white;box-shadow:0 6px 18px rgba(0,0,0,.18)"></div>`,
iconSize: [20, 20],
}), []);

if (isLoading) {
return ( <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center"> <LoadingSpinner size="lg" /> </div>
);
}

return (
<>
<Sidebar
open={sidebarOpen}
onToggle={() => setSidebarOpen(!sidebarOpen)}
/>

```
  <div className="min-h-screen bg-[#f4f7fb] lg:ml-64">

    <div className="p-5 lg:p-8 space-y-6">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>
          <h1 className="text-4xl font-bold text-gray-800">
            Hub Management
          </h1>

          <p className="text-gray-500 mt-2">
            Manage employees, routes and operational hubs.
          </p>
        </div>

        <button className="h-12 px-5 rounded-2xl bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 shadow-lg shadow-red-200 transition-all">
          <Plus size={18} />
          Add Hub
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        <Card className="xl:col-span-4 bg-white border-0 rounded-3xl shadow-sm p-5">

          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search hubs..."
              className="w-full h-12 rounded-2xl bg-gray-100 border-0 pl-11 pr-4 focus:ring-2 focus:ring-red-400 outline-none"
            />
          </div>

          {weatherData && (
            <div className="mt-5 rounded-3xl bg-gradient-to-br from-orange-50 to-red-50 p-5 border border-orange-100">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm">
                  {weatherData.icon}
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Current Weather
                  </p>

                  <h3 className="text-xl font-bold text-gray-800">
                    {weatherData.temp}°C
                  </h3>

                  <p className="text-sm text-gray-500">
                    {weatherData.label}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="xl:col-span-8 bg-white border-0 rounded-3xl shadow-sm p-5">

          <div className="flex items-center gap-2 mb-5">
            <Route size={18} className="text-red-500" />
            <h3 className="font-bold text-gray-800 text-lg">
              Route Analytics
            </h3>
          </div>

          {routeData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {[
                {
                  label: 'Driving',
                  icon: Car,
                  data: routeData.car,
                  bg: 'from-red-50 to-orange-50',
                },
                {
                  label: 'Cycling',
                  icon: Bike,
                  data: routeData.riding,
                  bg: 'from-blue-50 to-cyan-50',
                },
                {
                  label: 'Walking',
                  icon: Footprints,
                  data: routeData.walking,
                  bg: 'from-green-50 to-emerald-50',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-3xl bg-gradient-to-br ${item.bg} border border-white p-5 shadow-sm`}
                >
                  <item.icon size={26} className="text-gray-700 mb-4" />

                  <p className="text-sm text-gray-500">
                    {item.label}
                  </p>

                  <h3 className="text-3xl font-bold text-gray-800 mt-2">
                    {formatDistance(item.data.distanceM)}
                  </h3>

                  <p className="mt-2 text-gray-600 font-medium">
                    {formatDuration(item.data.durationSec)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[160px] rounded-3xl bg-gray-50 flex flex-col items-center justify-center text-center border border-dashed border-gray-200">
              <CloudSun size={42} className="text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">
                Generate route analytics
              </p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        <GlassCard className="xl:col-span-8 rounded-3xl overflow-hidden border border-white shadow-lg p-0">

          <div className="h-[650px]">
            <MapContainer
              center={[14.5995, 120.9842]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {userLocation && (
                <Marker position={userLocation} icon={userIcon}>
                  <Popup>Your Location</Popup>
                </Marker>
              )}

              {filteredHubs.map((hub: any) => (
                <Marker
                  key={hub.id}
                  position={getHubCoordinates(hub)}
                  icon={hubIcon}
                  eventHandlers={{
                    click: () => setSelectedHub(hub),
                  }}
                >
                  <Popup>{hub.name}</Popup>
                </Marker>
              ))}

              {showDirections && routeData && (
                <Polyline
                  positions={routeData.car.coordinates}
                  color="#ef4444"
                  weight={6}
                />
              )}
            </MapContainer>
          </div>
        </GlassCard>

        <Card className="xl:col-span-4 bg-white rounded-3xl border-0 shadow-sm overflow-hidden">

          {selectedHub ? (
            <div className="flex flex-col h-full">

              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedHub.name}
                  </h3>

                  <p className="text-gray-500 mt-1">
                    {selectedHub.city}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedHub(null)}
                  className="h-10 w-10 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5">

                <div className="grid grid-cols-2 gap-4">

                  <div className="rounded-3xl bg-blue-50 p-5 border border-blue-100">
                    <p className="text-sm text-blue-600 font-medium">
                      Employees
                    </p>

                    <h3 className="text-4xl font-bold text-blue-900 mt-2">
                      {hubEmployees.length}
                    </h3>
                  </div>

                  <div className="rounded-3xl bg-orange-50 p-5 border border-orange-100">
                    <p className="text-sm text-orange-600 font-medium">
                      City
                    </p>

                    <h3 className="text-xl font-bold text-orange-900 mt-2 line-clamp-2">
                      {selectedHub.city}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={fetchRoute}
                  disabled={loadingRoute}
                  className="w-full h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                >
                  {loadingRoute ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Navigation size={18} />
                      Generate Directions
                    </>
                  )}
                </button>

                <div className="rounded-3xl border border-gray-100 overflow-hidden">

                  <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                    <Search size={16} className="text-gray-400" />

                    <input
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      placeholder="Search employees"
                      className="bg-transparent w-full outline-none text-sm"
                    />
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {!canViewEmployees ? (
                      <div className="p-10 text-center">
                        <Shield size={38} className="mx-auto text-gray-300 mb-3" />
                        <p className="font-medium text-gray-500">
                          Restricted Access
                        </p>
                      </div>
                    ) : (
                      hubEmployees.map((emp: any) => (
                        <div
                          key={emp.id}
                          className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-all"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                {emp.full_name}
                              </h4>

                              <p className="text-sm text-gray-500 mt-1">
                                {emp.position}
                              </p>
                            </div>

                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              emp.status?.toLowerCase() === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {emp.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="h-24 w-24 rounded-[28px] bg-red-50 flex items-center justify-center mb-5 shadow-inner">
                <Building2 size={36} className="text-red-500" />
              </div>

              <h3 className="text-3xl font-bold text-gray-800">
                Select a Hub
              </h3>

              <p className="text-gray-500 mt-3 leading-relaxed max-w-sm">
                Select a map marker to view hub employees, weather conditions and real-time route analytics.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  </div>
</>
```

);
};
