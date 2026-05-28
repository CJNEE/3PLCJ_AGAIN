
import React, {
  useState,
  useMemo,
  useEffect,
  useRef
} from 'react';

import {
  Card,
  LoadingSpinner
} from '@/components/common';

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
  Users,
  Footprints,
  Bike,
  Car,
  Plus,
  Route,
  Shield,
  Building2,
  CloudSun,
  Clock3
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

// ===============================
// BETTER SPEEDS
// ===============================

const WALKING_SPEED_KMH = 4.8;
const CYCLING_SPEED_KMH = 15;
const DRIVING_SPEED_KMH = 35;

// ===============================

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

function estimateTravelTime(
  distanceMeters: number,
  speedKmH: number
) {
  const km = distanceMeters / 1000;

  const hours = km / speedKmH;

  return Math.round(hours * 3600);
}

function parseOsrmResponse(
  data: any,
  mode: 'walking' | 'cycling' | 'driving'
): ParsedOsrmRoute | null {
  if (!data?.routes?.length) return null;

  const route = data.routes[0];

  const coordinates: [number, number][] =
    route.geometry.coordinates.map(
      (coord: [number, number]) => [
        coord[1],
        coord[0]
      ]
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
          duration: Math.round(step.duration ?? 0)
        });
      }

      const t = step.maneuver?.type;

      if (
        t &&
        t !== 'depart' &&
        t !== 'arrive'
      ) {
        turnCount += 1;
      }
    });
  });

  // ===============================
  // BETTER DURATION ESTIMATION
  // ===============================

  let duration = route.duration;

  if (mode === 'walking') {
    duration = estimateTravelTime(
      route.distance,
      WALKING_SPEED_KMH
    );
  }

  if (mode === 'cycling') {
    duration = estimateTravelTime(
      route.distance,
      CYCLING_SPEED_KMH
    );
  }

  if (mode === 'driving') {
    duration = estimateTravelTime(
      route.distance,
      DRIVING_SPEED_KMH
    );
  }

  return {
    coordinates,
    distanceM: route.distance,
    durationSec: duration,
    turns,
    turnCount
  };
}

async function fetchOsrmProfile(
  profile: string,
  mode: 'walking' | 'cycling' | 'driving',
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

  return parseOsrmResponse(data, mode);
}

function formatDistance(meters: number) {
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number) {
  const mins = Math.round(seconds / 60);

  if (mins < 60) {
    return `${mins} mins`;
  }

  const hrs = Math.floor(mins / 60);

  const rem = mins % 60;

  return `${hrs}h ${rem}m`;
}

interface HubState {
  selectedHub: any | null;
}

export const AdminHubsPage = () => {
  const { canViewEmployees } = useAuth();

  const [searchTerm, setSearchTerm] =
    useState('');

  const [employeeSearch, setEmployeeSearch] =
    useState('');

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 10;

  const [hubState, setHubState] =
    useState<HubState>({
      selectedHub: null
    });

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [userLocation, setUserLocation] =
    useState<[number, number] | null>(null);

  const [showDirections, setShowDirections] =
    useState(false);

  const [routeData, setRouteData] =
    useState<any>(null);

  const [weatherData, setWeatherData] =
    useState<any>(null);

  const [loadingRoute, setLoadingRoute] =
    useState(false);

  const mapRef = useRef(null);

  const { data, isLoading } = useGetHubs();

  const { data: employeesData } =
    useGetEmployees();

  const createHubMutation =
    useCreateHub();

  const updateHubMutation =
    useUpdateHub();

  const deleteHubMutation =
    useDeleteHub();

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [editingHubId, setEditingHubId] =
    useState<number | null>(null);

  const [newHub, setNewHub] = useState({
    name: '',
    location: '',
    city: 'Quezon',
    address: '',
    latitude: 14.676,
    longitude: 121.0437
  });

  const hubs = normalizeApiResponse(data);

  const allEmployees =
    normalizeApiResponse(employeesData);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude
          ]);
        }
      );
    }
  }, []);

  const cityCoords: Record<
    string,
    [number, number]
  > = {
    manila: [14.5995, 120.9842],
    quezon: [14.676, 121.0437],
    cebu: [10.3157, 123.8854],
    davao: [7.0731, 125.6121]
  };

  const getHubCoordinates = (
    hub: any
  ): [number, number] => {
    if (hub.latitude && hub.longitude) {
      return [hub.latitude, hub.longitude];
    }

    const city = hub.city?.toLowerCase();

    return (
      cityCoords[city] || [
        14.5995,
        120.9842
      ]
    );
  };

  // ===============================
  // WEATHER
  // ===============================

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

  // ===============================
  // ICONS
  // ===============================

  const hubIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: `
        <div
          style="
            width:20px;
            height:20px;
            background:#ef4444;
            border-radius:999px;
            border:4px solid white;
            box-shadow:0 8px 20px rgba(239,68,68,.45);
          "
        ></div>
      `,
        iconSize: [20, 20]
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
            width:20px;
            height:20px;
            background:#3b82f6;
            border-radius:999px;
            border:4px solid white;
            box-shadow:0 8px 20px rgba(59,130,246,.45);
          "
        ></div>
      `,
        iconSize: [20, 20]
      }),
    []
  );

  // ===============================
  // FILTERED HUBS
  // ===============================

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

  const getHubEmployeeCount = (
    hubId: number
  ) => {
    return allEmployees.filter(
      (emp: any) => emp.hub === hubId
    ).length;
  };

  // ===============================
  // EMPLOYEE FILTER
  // ===============================

  const hubEmployeesData = useMemo(() => {
    if (!hubState.selectedHub) return [];

    return allEmployees.filter((emp: any) => {
      return (
        emp.hub ===
          hubState.selectedHub.id &&
        (emp.full_name
          ?.toLowerCase()
          .includes(
            employeeSearch.toLowerCase()
          ) ||
          emp.position
            ?.toLowerCase()
            .includes(
              employeeSearch.toLowerCase()
            ))
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
    const start =
      (currentPage - 1) * itemsPerPage;

    return hubEmployeesData.slice(
      start,
      start + itemsPerPage
    );
  }, [hubEmployeesData, currentPage]);

  // ===============================
  // ROUTE FETCH
  // ===============================

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
            'walking',
            startLat,
            startLon,
            endLat,
            endLon
          ),

          fetchOsrmProfile(
            'cycling',
            'cycling',
            startLat,
            startLon,
            endLat,
            endLon
          ),

          fetchOsrmProfile(
            'driving',
            'driving',
            startLat,
            startLon,
            endLat,
            endLon
          )
        ]);

      if (walking && riding && car) {
        setRouteData({
          walking,
          riding,
          car
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
    if (
      !userLocation ||
      !hubState.selectedHub
    )
      return;

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
      selectedHub: hub
    });

    setCurrentPage(1);

    setEmployeeSearch('');
  };

  const handleCloseHub = () => {
    setHubState({
      selectedHub: null
    });

    setShowDirections(false);

    setRouteData(null);
  };

  // ===============================
  // LOADING
  // ===============================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f7fb]">
        <Sidebar
          open={sidebarOpen}
          onToggle={() =>
            setSidebarOpen(!sidebarOpen)
          }
        />

        <div className="lg:ml-64 p-6">
          <div className="h-40 rounded-[28px] bg-white animate-pulse mb-4" />

          <div className="h-[650px] rounded-[28px] bg-white animate-pulse" />
        </div>
      </div>
    );
  }

  // ===============================
  // MAIN
  // ===============================

  return (
    <>
      <Sidebar
        open={sidebarOpen}
        onToggle={() =>
          setSidebarOpen(!sidebarOpen)
        }
      />

      <div className="min-h-screen bg-[#f4f7fb] lg:ml-64">

        <div className="p-5 lg:p-8 space-y-6">

          {/* HEADER */}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Hub Management
              </h1>

              <p className="text-gray-500 mt-2">
                Manage hubs, employees,
                routes and analytics
              </p>
            </div>

            <button
              onClick={() =>
                setShowAddModal(true)
              }
              className="
                h-12
                px-6
                rounded-2xl
                bg-gradient-to-r
                from-red-500
                to-red-600
                hover:scale-[1.02]
                active:scale-[0.98]
                transition-all
                text-white
                font-semibold
                flex
                items-center
                gap-2
                shadow-lg
                shadow-red-500/20
              "
            >
              <Plus size={18} />
              Add Hub
            </button>

          </div>

          {/* SEARCH */}

          <Card className="rounded-[28px] border-0 bg-white shadow-sm p-5">

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
                  setSearchTerm(
                    e.target.value
                  )
                }
                className="
                  w-full
                  h-14
                  rounded-2xl
                  bg-[#f8fafc]
                  border
                  border-gray-200
                  pl-12
                  pr-4
                  outline-none
                  focus:ring-4
                  focus:ring-red-500/10
                  text-gray-800
                "
              />

            </div>

          </Card>

          {/* ANALYTICS */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {routeData ? (
              <>
                {[
                  {
                    title: 'Driving',
                    icon: Car,
                    color:
                      'from-blue-500 to-cyan-500',
                    data: routeData.car
                  },

                  {
                    title: 'Cycling',
                    icon: Bike,
                    color:
                      'from-emerald-500 to-green-500',
                    data: routeData.riding
                  },

                  {
                    title: 'Walking',
                    icon: Footprints,
                    color:
                      'from-orange-500 to-yellow-500',
                    data: routeData.walking
                  }
                ].map((item) => (
                  <div
                    key={item.title}
                    className="
                      rounded-[28px]
                      bg-white
                      p-5
                      shadow-sm
                      border
                      border-gray-100
                    "
                  >

                    <div
                      className={`
                        h-14
                        w-14
                        rounded-2xl
                        bg-gradient-to-r
                        ${item.color}
                        flex
                        items-center
                        justify-center
                        text-white
                        mb-4
                      `}
                    >
                      <item.icon size={24} />
                    </div>

                    <p className="text-gray-500 text-sm">
                      {item.title}
                    </p>

                    <h2 className="text-3xl font-bold text-gray-900 mt-2">
                      {formatDistance(
                        item.data.distanceM
                      )}
                    </h2>

                    <div className="flex items-center gap-2 mt-3 text-gray-500 text-sm">
                      <Clock3 size={15} />

                      {formatDuration(
                        item.data.durationSec
                      )}
                    </div>

                  </div>
                ))}
              </>
            ) : (
              <div className="md:col-span-3 rounded-[28px] bg-white h-40 flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                Select a hub to generate
                route analytics
              </div>
            )}

          </div>

          {/* MAP + SIDEBAR */}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

            {/* MAP */}

            <div className="xl:col-span-8 rounded-[32px] overflow-hidden shadow-sm border border-gray-200 bg-white">

              <div className="h-[700px]">

                <MapContainer
                  center={[14.5995, 120.9842]}
                  zoom={6}
                  style={{
                    height: '100%',
                    width: '100%'
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

                  {filteredHubs.map(
                    (hub: any) => (
                      <Marker
                        key={hub.id}
                        position={getHubCoordinates(
                          hub
                        )}
                        icon={hubIcon}
                        eventHandlers={{
                          click: () =>
                            handleMarkerClick(
                              hub
                            )
                        }}
                      >
                        <Popup>
                          {hub.name}
                        </Popup>
                      </Marker>
                    )
                  )}

                  {showDirections &&
                    routeData && (
                      <Polyline
                        positions={
                          routeData.car
                            .coordinates
                        }
                        color="#ef4444"
                        weight={6}
                      />
                    )}

                </MapContainer>

              </div>

            </div>

            {/* RIGHT PANEL */}

            <div className="xl:col-span-4">

              <Card className="rounded-[32px] bg-white border-0 shadow-sm overflow-hidden">

                {hubState.selectedHub ? (
                  <div>

                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">

                      <div>

                        <h2 className="text-2xl font-bold text-gray-900">
                          {
                            hubState.selectedHub
                              .name
                          }
                        </h2>

                        <p className="text-gray-500 mt-1">
                          {
                            hubState.selectedHub
                              .city
                          }
                        </p>

                      </div>

                      <button
                        onClick={
                          handleCloseHub
                        }
                        className="
                          h-11
                          w-11
                          rounded-2xl
                          hover:bg-gray-100
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <X size={20} />
                      </button>

                    </div>

                    <div className="p-6 space-y-5">

                      {/* WEATHER */}

                      {weatherData && (
                        <div className="rounded-3xl bg-gradient-to-r from-sky-50 to-blue-50 border border-blue-100 p-5">

                          <div className="flex items-center gap-4">

                            <div className="h-16 w-16 rounded-3xl bg-white flex items-center justify-center text-3xl shadow-sm">
                              {
                                weatherData.icon
                              }
                            </div>

                            <div>

                              <p className="text-gray-500 text-sm">
                                Current Weather
                              </p>

                              <h2 className="text-2xl font-bold text-gray-900">
                                {
                                  weatherData.temp
                                }
                                °C
                              </h2>

                              <p className="text-gray-600">
                                {
                                  weatherData.label
                                }
                              </p>

                            </div>

                          </div>

                        </div>
                      )}

                      {/* STATS */}

                      <div className="grid grid-cols-2 gap-4">

                        <div className="rounded-3xl bg-[#f8fafc] border border-gray-100 p-5">

                          <Users
                            size={22}
                            className="text-red-500 mb-3"
                          />

                          <p className="text-gray-500 text-sm">
                            Employees
                          </p>

                          <h2 className="text-3xl font-bold text-gray-900 mt-2">
                            {
                              hubEmployeesData.length
                            }
                          </h2>

                        </div>

                        <div className="rounded-3xl bg-[#f8fafc] border border-gray-100 p-5">

                          <MapPin
                            size={22}
                            className="text-blue-500 mb-3"
                          />

                          <p className="text-gray-500 text-sm">
                            City
                          </p>

                          <h2 className="text-lg font-bold text-gray-900 mt-2">
                            {
                              hubState
                                .selectedHub
                                .city
                            }
                          </h2>

                        </div>

                      </div>

                      {/* BUTTON */}

                      <button
                        onClick={
                          handleGetDirections
                        }
                        disabled={
                          loadingRoute
                        }
                        className="
                          w-full
                          h-14
                          rounded-2xl
                          bg-gradient-to-r
                          from-red-500
                          to-red-600
                          text-white
                          font-semibold
                          hover:scale-[1.01]
                          active:scale-[0.99]
                          transition-all
                          flex
                          items-center
                          justify-center
                          gap-2
                          shadow-lg
                          shadow-red-500/20
                        "
                      >
                        {loadingRoute ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Navigation
                              size={18}
                            />

                            Get Directions
                          </>
                        )}
                      </button>

                    </div>

                  </div>
                ) : (
                  <div className="h-[700px] flex flex-col items-center justify-center text-center p-8">

                    <div className="h-24 w-24 rounded-[32px] bg-red-100 flex items-center justify-center mb-6">

                      <Building2
                        size={40}
                        className="text-red-500"
                      />

                    </div>

                    <h2 className="text-3xl font-bold text-gray-900">
                      Select a Hub
                    </h2>

                    <p className="text-gray-500 mt-3 max-w-sm">
                      Choose a hub marker from
                      the map to see employees,
                      routes and analytics.
                    </p>

                  </div>
                )}

              </Card>

            </div>

          </div>

          {/* HUB CARDS */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {filteredHubs.map((hub: any) => {
              const employeeCount =
                getHubEmployeeCount(hub.id);

              return (
                <div
                  key={hub.id}
                  onClick={() =>
                    handleMarkerClick(hub)
                  }
                  className="
                    rounded-[30px]
                    bg-white
                    border
                    border-gray-100
                    p-6
                    hover:shadow-xl
                    hover:-translate-y-1
                    transition-all
                    cursor-pointer
                  "
                >

                  <div className="flex items-start justify-between">

                    <div>

                      <div className="flex items-center gap-3">

                        <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center">

                          <MapPin
                            size={20}
                            className="text-red-500"
                          />

                        </div>

                        <div>

                          <h3 className="font-bold text-lg text-gray-900">
                            {hub.name}
                          </h3>

                          <p className="text-sm text-gray-500">
                            {hub.city}
                          </p>

                        </div>

                      </div>

                      <p className="text-sm text-gray-400 mt-4 line-clamp-2">
                        {hub.address}
                      </p>

                    </div>

                    <div className="text-right">

                      <h2 className="text-4xl font-bold text-gray-900">
                        {employeeCount}
                      </h2>

                      <p className="text-xs text-gray-500">
                        Staff
                      </p>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        </div>

      </div>
    </>
  );
};
