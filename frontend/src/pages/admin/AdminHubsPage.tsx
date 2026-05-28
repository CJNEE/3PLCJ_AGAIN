import {
  MapPin,
  X,
  Search,
  Navigation,
  ChevronLeft,
  ChevronRight,

import React, {
useState,
@@ -1180,1300 +1162,4 @@ export const AdminHubsPage = () => {
</div>
</>
);
};
  Users,
  Footprints,
  Bike,
  Car,
  Plus,
  Trash2,
  Edit2,
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

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

export type ParsedOsrmRoute = {
  coordinates: [number, number][];
  distanceM: number;
  durationSec: number;
  turns: Array<{
    instruction: string;
    distance: number;
    duration: number;
  }>;
  turnCount: number;
};

function parseOsrmResponse(data: any): ParsedOsrmRoute | null {
  if (!data?.routes?.length) return null;

  const route = data.routes[0];

  const coordinates: [number, number][] =
    route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]]
    );

  const turns: Array<{
    instruction: string;
    distance: number;
    duration: number;
  }> = [];

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

      if (t && t !== 'depart' && t !== 'arrive') {
        turnCount += 1;
      }
    });
  });

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
  const url =
    `${OSRM_BASE}/${profile}/${startLon},${startLat};${endLon},${endLat}` +
    `?steps=true&geometries=geojson&overview=full`;

  const response = await fetch(url);
  const data = await response.json();

  return parseOsrmResponse(data);
}

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);

  if (mins < 60) return `${mins} min`;

  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;

  return `${hrs}h ${rem}m`;
}

interface HubState {
  selectedHub: any | null;
}

export const AdminHubsPage = () => {
  const { canViewEmployees } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const [hubState, setHubState] = useState<HubState>({
    selectedHub: null,
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [userLocation, setUserLocation] =
    useState<[number, number] | null>(null);

  const [showDirections, setShowDirections] = useState(false);

  const [routeData, setRouteData] = useState<{
    walking: ParsedOsrmRoute;
    riding: ParsedOsrmRoute;
    car: ParsedOsrmRoute;
  } | null>(null);

  const [weatherData, setWeatherData] = useState<{
    temp: number;
    label: string;
    icon: string;
  } | null>(null);

  const [loadingRoute, setLoadingRoute] = useState(false);

  const mapRef = useRef(null);

  const { data, isLoading } = useGetHubs();
  const { data: employeesData } = useGetEmployees();

  const createHubMutation = useCreateHub();
  const updateHubMutation = useUpdateHub();
  const deleteHubMutation = useDeleteHub();

  const [showAddModal, setShowAddModal] = useState(false);

  const [editingHubId, setEditingHubId] =
    useState<number | null>(null);

  const [newHub, setNewHub] = useState({
    name: '',
    location: '',
    city: 'Quezon',
    address: '',
    latitude: 14.676,
    longitude: 121.0437,
  });

  const hubs = normalizeApiResponse(data);
  const allEmployees = normalizeApiResponse(employeesData);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
        },
        (error) => {
          console.warn(error);
        }
      );
    }
  }, []);

  const cityCoords: Record<string, [number, number]> = {
    manila: [14.5995, 120.9842],
    quezon: [14.676, 121.0437],
    cebu: [10.3157, 123.8854],
    davao: [7.0731, 125.6121],
  };

  const getHubCoordinates = (
    hub: any
  ): [number, number] => {
    if (hub.latitude && hub.longitude) {
      return [hub.latitude, hub.longitude];
    }

    const city = hub.city?.toLowerCase();

    return cityCoords[city] || [14.5995, 120.9842];
  };

  useEffect(() => {
    async function loadWeather() {
      try {
        if (hubState.selectedHub) {
          const coords = getHubCoordinates(
            hubState.selectedHub
          );

          const weather = await fetchWeather(
            coords[0],
            coords[1]
          );

          setWeatherData(weather);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadWeather();
  }, [hubState.selectedHub]);

  const hubIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: `
        <div
          style="
            width:18px;
            height:18px;
            background:#dc2626;
            border-radius:999px;
            border:3px solid white;
            box-shadow:0 4px 12px rgba(0,0,0,.25);
          "
        ></div>
      `,
        iconSize: [18, 18],
      }),
    []
  );

  const userIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: `
        <div
          style="
            width:18px;
            height:18px;
            background:#2563eb;
            border-radius:999px;
            border:3px solid white;
            box-shadow:0 4px 12px rgba(0,0,0,.25);
          "
        ></div>
      `,
        iconSize: [18, 18],
      }),
    []
  );

  const filteredHubs = useMemo(() => {
    return hubs.filter((hub: any) => {
      return (
        hub.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        hub.location
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        hub.city
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm, hubs]);

  const getHubEmployeeCount = (hubId: number) => {
    return allEmployees.filter(
      (emp: any) => emp.hub === hubId
    ).length;
  };

  const hubEmployeesData = useMemo(() => {
    if (!hubState.selectedHub) return [];

    return allEmployees.filter((emp: any) => {
      return (
        emp.hub === hubState.selectedHub.id &&
        (
          emp.full_name
            ?.toLowerCase()
            .includes(employeeSearch.toLowerCase()) ||
          emp.position
            ?.toLowerCase()
            .includes(employeeSearch.toLowerCase())
        )
      );
    });
  }, [
    hubState.selectedHub,
    employeeSearch,
    allEmployees
  ]);

  const totalPages = Math.ceil(
    hubEmployeesData.length / itemsPerPage
  );

  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;

    return hubEmployeesData.slice(
      start,
      start + itemsPerPage
    );
  }, [hubEmployeesData, currentPage]);

  const fetchRoute = async (
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number
  ) => {
    setLoadingRoute(true);

    try {
      const [walking, riding, car] =
        await Promise.all([
          fetchOsrmProfile(
            'foot',
            startLat,
            startLon,
            endLat,
            endLon
          ),

          fetchOsrmProfile(
            'cycling',
            startLat,
            startLon,
            endLat,
            endLon
          ),

          fetchOsrmProfile(
            'driving',
            startLat,
            startLon,
            endLat,
            endLon
          ),
        ]);

      if (walking && riding && car) {
        setRouteData({
          walking,
          riding,
          car,
        });

        setShowDirections(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleGetDirections = () => {
    if (!userLocation || !hubState.selectedHub) return;

    const coords = getHubCoordinates(
      hubState.selectedHub
    );

    fetchRoute(
      userLocation[0],
      userLocation[1],
      coords[0],
      coords[1]
    );
  };

  const handleMarkerClick = (hub: any) => {
    setHubState({
      selectedHub: hub,
    });

    setCurrentPage(1);
    setEmployeeSearch('');
  };

  const handleCloseHub = () => {
    setHubState({
      selectedHub: null,
    });

    setShowDirections(false);
    setRouteData(null);
  };

  const handleAddHub = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      if (editingHubId) {
        await updateHubMutation.mutateAsync({
          id: editingHubId,
          data: newHub,
        });
      } else {
        await createHubMutation.mutateAsync(newHub);
      }

      setShowAddModal(false);

      setEditingHubId(null);

      setNewHub({
        name: '',
        location: '',
        city: 'Quezon',
        address: '',
        latitude: 14.676,
        longitude: 121.0437,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <Sidebar
          open={sidebarOpen}
          onToggle={() =>
            setSidebarOpen(!sidebarOpen)
          }
        />

        <div className="lg:ml-64 p-6">
          <div className="grid gap-4">
            <div className="h-32 rounded-3xl bg-gray-200 dark:bg-gray-900 animate-pulse" />
            <div className="h-[500px] rounded-3xl bg-gray-200 dark:bg-gray-900 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar
        open={sidebarOpen}
        onToggle={() =>
          setSidebarOpen(!sidebarOpen)
        }
      />

      <div className="min-h-screen bg-gray-50 dark:bg-black lg:ml-64">

        <div className="p-4 lg:p-8 space-y-6">

          {/* HEADER */}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                Hub Management
              </h1>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage locations, employees, routes and operations
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="
                h-12
                px-5
                rounded-2xl
                bg-red-600
                hover:bg-red-700
                text-white
                font-medium
                shadow-lg
                transition-all
                flex
                items-center
                justify-center
                gap-2
              "
            >
              <Plus size={18} />
              Add Hub
            </button>

          </div>

          {/* SEARCH + STATS */}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

            <Card className="xl:col-span-4 p-5 rounded-3xl border-0 shadow-sm">

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  placeholder="Search hubs..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  className="
                    w-full
                    h-12
                    pl-11
                    pr-4
                    rounded-2xl
                    border
                    border-gray-200
                    dark:border-gray-700
                    bg-white
                    dark:bg-gray-900
                    text-sm
                    focus:outline-none
                    focus:ring-2
                    focus:ring-red-500/20
                  "
                />
              </div>

              {weatherData && (
                <div className="mt-5 flex items-center gap-4 rounded-2xl bg-gray-50 dark:bg-gray-900 p-4">

                  <div className="h-12 w-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-2xl">
                    {weatherData.icon}
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Current Weather
                    </p>

                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {weatherData.temp}°C · {weatherData.label}
                    </h3>
                  </div>

                </div>
              )}

            </Card>

            <Card className="xl:col-span-8 p-5 rounded-3xl border-0 shadow-sm">

              <div className="flex items-center gap-2 mb-4">
                <Route size={18} className="text-red-600" />

                <h3 className="font-semibold">
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
                    },

                    {
                      label: 'Cycling',
                      icon: Bike,
                      data: routeData.riding,
                    },

                    {
                      label: 'Walking',
                      icon: Footprints,
                      data: routeData.walking,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="
                        rounded-2xl
                        border
                        border-gray-100
                        dark:border-gray-800
                        bg-gray-50
                        dark:bg-gray-900
                        p-4
                      "
                    >
                      <item.icon
                        size={20}
                        className="text-red-600 mb-3"
                      />

                      <p className="text-sm text-gray-500">
                        {item.label}
                      </p>

                      <h3 className="text-2xl font-semibold mt-1">
                        {formatDistance(
                          item.data.distanceM
                        )}
                      </h3>

                      <p className="text-sm text-gray-400 mt-1">
                        {formatDuration(
                          item.data.durationSec
                        )}
                      </p>
                    </div>
                  ))}

                </div>
              ) : (
                <div className="h-full min-h-[120px] flex items-center justify-center text-gray-400 text-sm">
                  Select a hub and generate directions
                </div>
              )}

            </Card>

          </div>

          {/* MAP SECTION */}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

            <GlassCard className="xl:col-span-8 overflow-hidden rounded-3xl p-0 border border-gray-200 dark:border-gray-800 shadow-sm">

              <div className="h-[650px] relative">

                <MapContainer
                  center={[14.5995, 120.9842]}
                  zoom={6}
                  style={{
                    height: '100%',
                    width: '100%',
                  }}
                  ref={mapRef}
                >

                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {userLocation && (
                    <Marker
                      position={userLocation}
                      icon={userIcon}
                    >
                      <Popup>
                        Your Location
                      </Popup>
                    </Marker>
                  )}

                  {filteredHubs.map((hub: any) => (
                    <Marker
                      key={hub.id}
                      position={getHubCoordinates(hub)}
                      icon={hubIcon}
                      eventHandlers={{
                        click: () =>
                          handleMarkerClick(hub),
                      }}
                    >
                      <Popup>
                        {hub.name}
                      </Popup>
                    </Marker>
                  ))}

                  {showDirections &&
                    routeData && (
                      <Polyline
                        positions={
                          routeData.car.coordinates
                        }
                        color="#dc2626"
                        weight={5}
                      />
                    )}

                </MapContainer>

              </div>

            </GlassCard>

            {/* SIDE PANEL */}

            <Card className="xl:col-span-4 rounded-3xl border-0 shadow-sm overflow-hidden">

              {hubState.selectedHub ? (
                <div className="flex flex-col h-full">

                  <div className="p-5 border-b dark:border-gray-800 flex items-center justify-between">

                    <div>
                      <h3 className="text-xl font-semibold">
                        {hubState.selectedHub.name}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        {hubState.selectedHub.city}
                      </p>
                    </div>

                    <button
                      onClick={handleCloseHub}
                      className="h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
                    >
                      <X size={18} />
                    </button>

                  </div>

                  <div className="p-5 space-y-5 overflow-y-auto">

                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        type="text"
                        placeholder="Search employees..."
                        value={employeeSearch}
                        onChange={(e) =>
                          setEmployeeSearch(
                            e.target.value
                          )
                        }
                        className="
                          w-full
                          h-11
                          pl-10
                          pr-4
                          rounded-2xl
                          border
                          border-gray-200
                          dark:border-gray-700
                          bg-gray-50
                          dark:bg-gray-900
                          text-sm
                        "
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">

                      <div className="rounded-2xl bg-gray-50 dark:bg-gray-900 p-4">
                        <p className="text-sm text-gray-500">
                          Total Staff
                        </p>

                        <h3 className="text-3xl font-semibold mt-2">
                          {hubEmployeesData.length}
                        </h3>
                      </div>

                      <div className="rounded-2xl bg-gray-50 dark:bg-gray-900 p-4">
                        <p className="text-sm text-gray-500">
                          Location
                        </p>

                        <h3 className="text-lg font-semibold mt-2 line-clamp-2">
                          {hubState.selectedHub.city}
                        </h3>
                      </div>

                    </div>

                    {/* EMPLOYEE TABLE */}

                    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">

                      <table className="w-full text-sm">

                        <thead className="bg-gray-50 dark:bg-gray-900">

                          <tr>
                            <th className="text-left px-4 py-3 font-medium">
                              Employee
                            </th>

                            <th className="text-left px-4 py-3 font-medium">
                              Position
                            </th>

                            <th className="text-left px-4 py-3 font-medium">
                              Status
                            </th>
                          </tr>

                        </thead>

                        <tbody>

                          {!canViewEmployees ? (
                            <tr>
                              <td
                                colSpan={3}
                                className="py-12 text-center"
                              >
                                <div className="flex flex-col items-center">

                                  <Shield
                                    size={30}
                                    className="text-gray-300 mb-2"
                                  />

                                  <p className="font-medium text-gray-500">
                                    Restricted Access
                                  </p>

                                </div>
                              </td>
                            </tr>
                          ) : (
                            paginatedEmployees.map(
                              (emp: any) => (
                                <tr
                                  key={emp.id}
                                  className="border-t border-gray-100 dark:border-gray-800"
                                >
                                  <td className="px-4 py-3 font-medium">
                                    {emp.full_name}
                                  </td>

                                  <td className="px-4 py-3 text-gray-500">
                                    {emp.position}
                                  </td>

                                  <td className="px-4 py-3">
                                    <span
                                      className={`
                                        px-2.5
                                        py-1
                                        rounded-full
                                        text-xs
                                        font-medium
                                        ${
                                          emp.status
                                            ?.toLowerCase() ===
                                          'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }
                                      `}
                                    >
                                      {emp.status}
                                    </span>
                                  </td>
                                </tr>
                              )
                            )
                          )}

                        </tbody>

                      </table>

                    </div>

                    {/* PAGINATION */}

                    <div className="flex items-center justify-between">

                      <button
                        onClick={() =>
                          setCurrentPage((p) =>
                            Math.max(1, p - 1)
                          )
                        }
                        className="h-10 w-10 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <p className="text-sm text-gray-500">
                        Page {currentPage} of{' '}
                        {totalPages || 1}
                      </p>

                      <button
                        onClick={() =>
                          setCurrentPage((p) =>
                            Math.min(
                              totalPages,
                              p + 1
                            )
                          )
                        }
                        className="h-10 w-10 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                      >
                        <ChevronRight size={18} />
                      </button>

                    </div>

                    <button
                      onClick={handleGetDirections}
                      disabled={loadingRoute}
                      className="
                        w-full
                        h-12
                        rounded-2xl
                        bg-red-600
                        hover:bg-red-700
                        text-white
                        font-medium
                        transition-all
                        flex
                        items-center
                        justify-center
                        gap-2
                      "
                    >
                      {loadingRoute ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Navigation size={16} />
                          Get Directions
                        </>
                      )}
                    </button>

                  </div>

                </div>
              ) : (
                <div className="h-full flex flex-col justify-center items-center p-8 text-center">

                  <div className="h-20 w-20 rounded-3xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-5">
                    <Building2
                      size={32}
                      className="text-red-600"
                    />
                  </div>

                  <h3 className="text-2xl font-semibold">
                    Select a Hub
                  </h3>

                  <p className="text-gray-500 mt-2 max-w-sm">
                    Click any location marker on the map
                    to view employees, weather,
                    directions and route analytics.
                  </p>

                </div>
              )}

            </Card>

          </div>

          {/* HUB CARDS */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {filteredHubs.map((hub: any) => {
              const employeeCount =
                getHubEmployeeCount(hub.id);

              return (
                <GlassCard
                  key={hub.id}
                  onClick={() =>
                    handleMarkerClick(hub)
                  }
                  className="
                    p-5
                    rounded-3xl
                    border
                    border-gray-200/60
                    dark:border-gray-800
                    hover:border-red-500/40
                    hover:shadow-xl
                    transition-all
                    cursor-pointer
                  "
                >

                  <div className="flex items-start justify-between">

                    <div className="flex-1">

                      <div className="flex items-center gap-2">

                        <MapPin
                          size={18}
                          className="text-red-600"
                        />

                        <h3 className="font-semibold text-lg">
                          {hub.name}
                        </h3>

                      </div>

                      <p className="text-sm text-gray-500 mt-2">
                        {hub.location ||
                          hub.city}
                      </p>

                      <p className="text-xs text-gray-400 mt-3">
                        {hub.address}
                      </p>

                    </div>

                    <div className="text-right">

                      <h3 className="text-3xl font-semibold">
                        {employeeCount}
                      </h3>

                      <p className="text-xs text-gray-400">
                        Employees
                      </p>

                    </div>

                  </div>

                </GlassCard>
              );
            })}

          </div>

        </div>

      </div>

      {/* MODAL */}

      {showAddModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-gray-950 overflow-hidden shadow-2xl">

            <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between">

              <h3 className="text-2xl font-semibold">
                {editingHubId
                  ? 'Edit Hub'
                  : 'Add Hub'}
              </h3>

              <button
                onClick={() =>
                  setShowAddModal(false)
                }
                className="h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={handleAddHub}
              className="p-6 space-y-5"
            >

              <div>
                <label className="text-sm font-medium">
                  Hub Name
                </label>

                <input
                  required
                  value={newHub.name}
                  onChange={(e) =>
                    setNewHub({
                      ...newHub,
                      name: e.target.value,
                    })
                  }
                  className="mt-2 w-full h-12 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="text-sm font-medium">
                    Location
                  </label>

                  <input
                    required
                    value={newHub.location}
                    onChange={(e) =>
                      setNewHub({
                        ...newHub,
                        location:
                          e.target.value,
                      })
                    }
                    className="mt-2 w-full h-12 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    City
                  </label>

                  <input
                    required
                    value={newHub.city}
                    onChange={(e) =>
                      setNewHub({
                        ...newHub,
                        city: e.target.value,
                      })
                    }
                    className="mt-2 w-full h-12 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  />
                </div>

              </div>

              <div>
                <label className="text-sm font-medium">
                  Address
                </label>

                <input
                  required
                  value={newHub.address}
                  onChange={(e) =>
                    setNewHub({
                      ...newHub,
                      address:
                        e.target.value,
                    })
                  }
                  className="mt-2 w-full h-12 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="text-sm font-medium">
                    Latitude
                  </label>

                  <input
                    required
                    type="number"
                    step="any"
                    value={newHub.latitude}
                    onChange={(e) =>
                      setNewHub({
                        ...newHub,
                        latitude:
                          parseFloat(
                            e.target.value
                          ),
                      })
                    }
                    className="mt-2 w-full h-12 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Longitude
                  </label>

                  <input
                    required
                    type="number"
                    step="any"
                    value={newHub.longitude}
                    onChange={(e) =>
                      setNewHub({
                        ...newHub,
                        longitude:
                          parseFloat(
                            e.target.value
                          ),
                      })
                    }
                    className="mt-2 w-full h-12 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  />
                </div>

              </div>

              <div className="pt-4 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowAddModal(false)
                  }
                  className="h-11 px-5 rounded-2xl border border-gray-200 dark:border-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="
                    h-11
                    px-6
                    rounded-2xl
                    bg-red-600
                    hover:bg-red-700
                    text-white
                    font-medium
                    flex
                    items-center
                    gap-2
                  "
                >
                  {(createHubMutation.isPending ||
                    updateHubMutation.isPending) && (
                    <LoadingSpinner size="sm" />
                  )}

                  {editingHubId
                    ? 'Update Hub'
                    : 'Create Hub'}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}
    </>
  );
};
