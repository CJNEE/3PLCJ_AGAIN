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

import {
  useGetHubs,
  useGetEmployees
} from '@/hooks/useQueries';

import {
  MapPin,
  X,
  Search,
  Navigation,
  Users,
  Footprints,
  Bike,
  Car,
  Plus,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building2
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

// ======================================
// CONSTANTS
// ======================================

const OSRM_BASE =
  'https://router.project-osrm.org/route/v1';

const WALKING_SPEED_KMH = 4.8;
const CYCLING_SPEED_KMH = 15;
const DRIVING_SPEED_KMH = 35;

// ======================================
// TYPES
// ======================================

interface Hub {
  id: number;
  name: string;
  location?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface Employee {
  id: number;
  hub: number;
  full_name?: string;
  position?: string;
  status?: string;
}

interface WeatherData {
  temp: number;
  label: string;
  icon: string;
}

interface HubState {
  selectedHub: Hub | null;
}

type ParsedOsrmRoute = {
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

// ======================================
// UTILITIES
// ======================================

function estimateTravelTime(
  distanceMeters: number,
  speedKmH: number
) {
  const km = distanceMeters / 1000;

  const hours = km / speedKmH;

  return Math.round(hours * 3600);
}

function formatDistance(
  meters: number
) {
  return `${(
    meters / 1000
  ).toFixed(1)} km`;
}

function formatDuration(
  seconds: number
) {
  const mins = Math.round(
    seconds / 60
  );

  if (mins < 60) {
    return `${mins} mins`;
  }

  const hrs = Math.floor(
    mins / 60
  );

  const rem = mins % 60;

  return `${hrs}h ${rem}m`;
}

// ======================================
// PARSE OSRM
// ======================================

function parseOsrmResponse(
  data: any,
  mode:
    | 'walking'
    | 'cycling'
    | 'driving'
): ParsedOsrmRoute | null {

  if (!data?.routes?.length) {
    return null;
  }

  const route =
    data.routes[0];

  const coordinates:
    [number, number][] =
    route.geometry.coordinates.map(
      (
        coord: [
          number,
          number
        ]
      ) => [
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

  route.legs?.forEach(
    (leg: any) => {

      leg.steps?.forEach(
        (step: any) => {

          const instr =
            step.maneuver
              ?.instruction;

          if (instr) {

            turns.push({
              instruction:
                instr,
              distance:
                Math.round(
                  step.distance ??
                    0
                ),
              duration:
                Math.round(
                  step.duration ??
                    0
                )
            });

          }

          const t =
            step.maneuver?.type;

          if (
            t &&
            t !== 'depart' &&
            t !== 'arrive'
          ) {
            turnCount += 1;
          }

        }
      );

    }
  );

  let duration =
    route.duration;

  if (mode === 'walking') {
    duration =
      estimateTravelTime(
        route.distance,
        WALKING_SPEED_KMH
      );
  }

  if (mode === 'cycling') {
    duration =
      estimateTravelTime(
        route.distance,
        CYCLING_SPEED_KMH
      );
  }

  if (mode === 'driving') {
    duration =
      estimateTravelTime(
        route.distance,
        DRIVING_SPEED_KMH
      );
  }

  return {
    coordinates,
    distanceM:
      route.distance,
    durationSec: duration,
    turns,
    turnCount
  };
}

// ======================================
// FETCH ROUTE
// ======================================

async function fetchOsrmProfile(
  profile: string,
  mode:
    | 'walking'
    | 'cycling'
    | 'driving',
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<ParsedOsrmRoute | null> {

  const url =
    `${OSRM_BASE}/${profile}/${startLon},${startLat};${endLon},${endLat}` +
    `?steps=true&geometries=geojson&overview=full`;

  const response =
    await fetch(url);

  const data =
    await response.json();

  return parseOsrmResponse(
    data,
    mode
  );
}

// ======================================
// COMPONENT
// ======================================

export const AdminHubsPage =
  () => {

    const {
      canViewEmployees
    } = useAuth();

    const [
      searchTerm,
      setSearchTerm
    ] = useState('');

    const [
      employeeSearch,
      setEmployeeSearch
    ] = useState('');

    const [
      currentPage,
      setCurrentPage
    ] = useState(1);

    const itemsPerPage = 8;

    const [
      hubState,
      setHubState
    ] = useState<HubState>({
      selectedHub: null
    });

    const [
      sidebarOpen,
      setSidebarOpen
    ] = useState(false);

    const [
      userLocation,
      setUserLocation
    ] = useState<
      [number, number] | null
    >(null);

    const [
      showDirections,
      setShowDirections
    ] = useState(false);

    const [
      loadingRoute,
      setLoadingRoute
    ] = useState(false);

    const [
      weatherData,
      setWeatherData
    ] =
      useState<WeatherData | null>(
        null
      );

    const [
      routeData,
      setRouteData
    ] = useState<{
      walking: ParsedOsrmRoute;
      riding: ParsedOsrmRoute;
      car: ParsedOsrmRoute;
    } | null>(null);

    const mapRef =
      useRef(null);

    const {
      data,
      isLoading
    } = useGetHubs();

    const {
      data: employeesData
    } = useGetEmployees();

    const hubs: Hub[] =
      normalizeApiResponse(
        data
      );

    const allEmployees:
      Employee[] =
      normalizeApiResponse(
        employeesData
      );

    // ======================================
    // GEOLOCATION
    // ======================================

    useEffect(() => {

      if (
        navigator.geolocation
      ) {

        navigator.geolocation.getCurrentPosition(
          (
            position
          ) => {

            setUserLocation([
              position.coords
                .latitude,
              position.coords
                .longitude
            ]);

          }
        );

      }

    }, []);

    // ======================================
    // CITY COORDS
    // ======================================

    const cityCoords:
      Record<
        string,
        [number, number]
      > = {
      manila: [
        14.5995,
        120.9842
      ],
      quezon: [
        14.676,
        121.0437
      ],
      cebu: [
        10.3157,
        123.8854
      ],
      davao: [
        7.0731,
        125.6121
      ]
    };

    const getHubCoordinates =
      (
        hub: Hub
      ): [
        number,
        number
      ] => {

        if (
          hub.latitude &&
          hub.longitude
        ) {

          return [
            hub.latitude,
            hub.longitude
          ];

        }

        const city =
          hub.city?.toLowerCase() ??
          '';

        return (
          cityCoords[
            city
          ] || [
            14.5995,
            120.9842
          ]
        );

      };

    // ======================================
    // WEATHER
    // ======================================

    useEffect(() => {

      async function loadWeather() {

        try {

          if (
            hubState.selectedHub
          ) {

            const coords =
              getHubCoordinates(
                hubState.selectedHub
              );

            const weather =
              await fetchWeather(
                coords[0],
                coords[1]
              );

            setWeatherData(
              weather as WeatherData
            );

          }

        } catch (
          error
        ) {

          console.error(
            error
          );

        }

      }

      loadWeather();

    }, [
      hubState.selectedHub
    ]);

    // ======================================
    // ICONS
    // ======================================

    const hubIcon =
      useMemo(
        () =>
          L.divIcon({
            className:
              '',

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

            iconSize: [
              20,
              20
            ]
          }),
        []
      );

    const userIcon =
      useMemo(
        () =>
          L.divIcon({
            className:
              '',

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

            iconSize: [
              20,
              20
            ]
          }),
        []
      );

    // ======================================
    // FILTER HUBS
    // ======================================

    const filteredHubs =
      useMemo(() => {

        return hubs.filter(
          (
            hub: Hub
          ) =>

            hub.name
              ?.toLowerCase()
              .includes(
                searchTerm.toLowerCase()
              ) ||

            hub.location
              ?.toLowerCase()
              .includes(
                searchTerm.toLowerCase()
              ) ||

            hub.city
              ?.toLowerCase()
              .includes(
                searchTerm.toLowerCase()
              )

        );

      }, [
        hubs,
        searchTerm
      ]);

    const getHubEmployeeCount =
      (
        hubId: number
      ) => {

        return allEmployees.filter(
          (
            emp: Employee
          ) =>
            emp.hub === hubId
        ).length;

      };

    // ======================================
    // EMPLOYEE FILTER
    // ======================================

    const hubEmployeesData =
      useMemo(() => {

        if (
          !hubState.selectedHub
        ) {
          return [];
        }

        return allEmployees.filter(
          (
            emp: Employee
          ) =>

            emp.hub ===
              hubState
                .selectedHub
                ?.id &&

            (
              emp.full_name
                ?.toLowerCase()
                .includes(
                  employeeSearch.toLowerCase()
                ) ||

              emp.position
                ?.toLowerCase()
                .includes(
                  employeeSearch.toLowerCase()
                )
            )

        );

      }, [
        hubState.selectedHub,
        employeeSearch,
        allEmployees
      ]);

    // ======================================
    // EMPLOYMENT BAR DATA
    // ======================================

    const employmentTypeData =
      useMemo(() => {

        const map =
          new Map<
            string,
            number
          >();

        hubEmployeesData.forEach(
          (
            emp: Employee
          ) => {

            const key =
              emp.position ||
              'Unassigned';

            map.set(
              key,
              (map.get(key) || 0) + 1
            );

          }
        );

        return Array.from(
          map.entries()
        )
          .map(
            ([
              name,
              value
            ]) => ({
              name,
              value
            })
          )
          .slice(0, 5);

      }, [
        hubEmployeesData
      ]);

    // ======================================
    // PAGINATION
    // ======================================

    const totalPages =
      Math.ceil(
        hubEmployeesData.length /
          itemsPerPage
      );

    const paginatedEmployees =
      useMemo(() => {

        const start =
          (currentPage - 1) *
          itemsPerPage;

        return hubEmployeesData.slice(
          start,
          start + itemsPerPage
        );

      }, [
        hubEmployeesData,
        currentPage
      ]);

    // ======================================
    // ROUTES
    // ======================================

    const fetchRealRoute =
      async (
        startLat: number,
        startLon: number,
        endLat: number,
        endLon: number
      ) => {

        setLoadingRoute(
          true
        );

        try {

          const [
            walking,
            riding,
            car
          ] =
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

          if (
            walking &&
            riding &&
            car
          ) {

            setRouteData({
              walking,
              riding,
              car
            });

            setShowDirections(
              true
            );

          }

        } catch (
          error
        ) {

          console.error(
            error
          );

        } finally {

          setLoadingRoute(
            false
          );

        }

      };

    const handleGetDirections =
      () => {

        if (
          !userLocation ||
          !hubState.selectedHub
        ) {
          return;
        }

        const coords =
          getHubCoordinates(
            hubState.selectedHub
          );

        fetchRealRoute(
          userLocation[0],
          userLocation[1],
          coords[0],
          coords[1]
        );

      };

    const handleMarkerClick =
      (
        hub: Hub
      ) => {

        setHubState({
          selectedHub:
            hub
        });

        setEmployeeSearch(
          ''
        );

        setCurrentPage(1);

      };

    const handleCloseHub =
      () => {

        setHubState({
          selectedHub:
            null
        });

        setShowDirections(
          false
        );

        setRouteData(
          null
        );

      };

    // ======================================
    // LOADING
    // ======================================

    if (isLoading) {

      return (
        <div className="min-h-screen bg-[#020817]">

          <Sidebar
            open={
              sidebarOpen
            }
            onToggle={() =>
              setSidebarOpen(
                !sidebarOpen
              )
            }
          />

          <div className="lg:ml-64 flex items-center justify-center min-h-screen">

            <LoadingSpinner />

          </div>

        </div>
      );

    }

    // ======================================
    // MAIN
    // ======================================

    return (
      <>

        <Sidebar
          open={
            sidebarOpen
          }
          onToggle={() =>
            setSidebarOpen(
              !sidebarOpen
            )
          }
        />

        <div className="min-h-screen bg-[#020817] lg:ml-64">

          <div className="p-5 lg:p-8 space-y-6">

            {/* HEADER */}

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

              <div>

                <h1 className="text-4xl font-black text-white">
                  Hub Management
                </h1>

                <p className="text-slate-400 mt-2">
                  Manage hubs,
                  employees and
                  routes
                </p>

              </div>

              <button
                className="
                  h-12
                  px-6
                  rounded-2xl
                  bg-red-600
                  hover:bg-red-700
                  text-white
                  font-bold
                  flex
                  items-center
                  gap-2
                  transition-all
                "
              >

                <Plus size={18} />

                Add Hub

              </button>

            </div>

            {/* SEARCH */}

            <Card className="rounded-[28px] bg-[#0f172a] border border-[#1e293b] p-5">

              <div className="relative">

                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="text"
                  placeholder="Search hubs..."
                  value={
                    searchTerm
                  }
                  onChange={(
                    e
                  ) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    h-14
                    rounded-2xl
                    bg-[#020817]
                    border
                    border-[#1e293b]
                    pl-12
                    pr-4
                    text-white
                    placeholder:text-slate-500
                    outline-none
                  "
                />

              </div>

            </Card>

            {/* MAP + PANEL */}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

              {/* MAP */}

              <div className="xl:col-span-8 rounded-[32px] overflow-hidden border border-[#1e293b] bg-[#0f172a]">

                <div className="h-[700px]">

                  <MapContainer
                    center={[
                      14.5995,
                      120.9842
                    ]}
                    zoom={6}
                    style={{
                      height:
                        '100%',
                      width:
                        '100%'
                    }}
                    ref={
                      mapRef
                    }
                  >

                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {userLocation && (

                      <Marker
                        position={
                          userLocation
                        }
                        icon={
                          userIcon
                        }
                      >
                        <Popup>
                          Your
                          Location
                        </Popup>
                      </Marker>

                    )}

                    {filteredHubs.map(
                      (
                        hub
                      ) => (

                        <Marker
                          key={
                            hub.id
                          }
                          position={getHubCoordinates(
                            hub
                          )}
                          icon={
                            hubIcon
                          }
                          eventHandlers={{
                            click:
                              () =>
                                handleMarkerClick(
                                  hub
                                )
                          }}
                        >

                          <Popup>
                            {
                              hub.name
                            }
                          </Popup>

                        </Marker>

                      )
                    )}

                    {showDirections &&
                      routeData?.car
                        ?.coordinates && (

                        <Polyline
                          positions={
                            routeData
                              .car
                              .coordinates
                          }
                          color="#ef4444"
                          weight={
                            5
                          }
                        />

                      )}

                  </MapContainer>

                </div>

              </div>

              {/* RIGHT PANEL */}

              <div className="xl:col-span-4">

                <Card className="rounded-[32px] bg-[#081224] border border-[#1e2b44] overflow-hidden h-full">

                  {hubState.selectedHub ? (

                    <div className="flex flex-col h-full">

                      {/* HEADER */}

                      <div className="p-6 border-b border-[#1e2b44] flex items-start justify-between">

                        <div>

                          <h2 className="text-2xl font-black text-white">
                            {
                              hubState
                                .selectedHub
                                .name
                            }
                          </h2>

                          <p className="text-slate-400 mt-2">
                            {
                              hubState
                                .selectedHub
                                .city
                            }
                          </p>

                        </div>

                        <button
                          onClick={
                            handleCloseHub
                          }
                          className="h-11 w-11 rounded-2xl hover:bg-white/5 flex items-center justify-center text-slate-400"
                        >

                          <X size={20} />

                        </button>

                      </div>

                      {/* CONTENT */}

                      <div className="p-6 space-y-5 flex-1 overflow-y-auto">

                        {/* SEARCH */}

                        <div className="relative">

                          <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                          />

                          <input
                            type="text"
                            placeholder="Search Name"
                            value={
                              employeeSearch
                            }
                            onChange={(
                              e
                            ) => {

                              setEmployeeSearch(
                                e
                                  .target
                                  .value
                              );

                              setCurrentPage(
                                1
                              );

                            }}
                            className="
                              w-full
                              h-14
                              rounded-2xl
                              bg-[#0f1b31]
                              border
                              border-[#27344e]
                              pl-12
                              pr-4
                              text-white
                              placeholder:text-slate-500
                              outline-none
                            "
                          />

                        </div>

                        {/* WEATHER */}

                        {weatherData && (

                          <div className="rounded-3xl bg-[#0f1b31] border border-[#27344e] p-5">

                            <div className="flex items-center gap-4">

                              <div className="h-16 w-16 rounded-3xl bg-[#13203a] flex items-center justify-center text-3xl">
                                {
                                  weatherData.icon
                                }
                              </div>

                              <div>

                                <p className="text-slate-400 text-sm">
                                  Current
                                  Weather
                                </p>

                                <h2 className="text-3xl font-black text-white">
                                  {
                                    weatherData.temp
                                  }
                                  °C
                                </h2>

                                <p className="text-slate-300">
                                  {
                                    weatherData.label
                                  }
                                </p>

                              </div>

                            </div>

                          </div>

                        )}

                        {/* EMPLOYMENT */}

                        <div className="grid grid-cols-2 gap-4">

                          <div className="rounded-3xl bg-[#0f1b31] border border-[#27344e] p-5">

                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
                              Employment
                            </p>

                            <div className="space-y-3">

                              {employmentTypeData.length >
                              0 ? (

                                employmentTypeData.map(
                                  (
                                    item
                                  ) => {

                                    const total =
                                      hubEmployeesData.length ||
                                      1;

                                    const width =
                                      (item.value /
                                        total) *
                                      100;

                                    return (

                                      <div
                                        key={
                                          item.name
                                        }
                                      >

                                        <div className="flex items-center justify-between mb-1">

                                          <span className="text-xs text-slate-300">
                                            {
                                              item.name
                                            }
                                          </span>

                                          <span className="text-xs text-slate-500">
                                            {
                                              item.value
                                            }
                                          </span>

                                        </div>

                                        <div className="h-2 rounded-full bg-[#1a2740] overflow-hidden">

                                          <div
                                            className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600"
                                            style={{
                                              width: `${width}%`
                                            }}
                                          />

                                        </div>

                                      </div>

                                    );

                                  }
                                )

                              ) : (

                                <div className="text-sm text-slate-500 italic">
                                  No
                                  employment
                                  data
                                </div>

                              )}

                            </div>

                          </div>

                          {/* TOTAL */}

                          <div className="rounded-3xl bg-[#0f1b31] border border-[#27344e] p-5 flex flex-col justify-center items-center">

                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                              Total
                            </p>

                            <h2 className="text-5xl font-black text-white mt-4">
                              {
                                hubEmployeesData.length
                              }
                            </h2>

                          </div>

                        </div>

                        {/* TABLE */}

                        <div className="rounded-3xl border border-[#27344e] overflow-hidden bg-[#0b1528]">

                          <div className="bg-black text-white grid grid-cols-12 px-4 py-3 text-[11px] font-black uppercase tracking-widest">

                            <div className="col-span-5">
                              Name
                            </div>

                            <div className="col-span-4">
                              Position
                            </div>

                            <div className="col-span-3 text-center">
                              Status
                            </div>

                          </div>

                          <div className="max-h-[260px] overflow-y-auto">

                            {!canViewEmployees ? (

                              <div className="py-12 flex flex-col items-center justify-center text-center">

                                <Shield
                                  size={
                                    28
                                  }
                                  className="text-slate-600 mb-3"
                                />

                                <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                                  Restricted
                                  Access
                                </p>

                              </div>

                            ) : paginatedEmployees.length >
                              0 ? (

                              paginatedEmployees.map(
                                (
                                  emp
                                ) => {

                                  const status =
                                    emp.status?.toLowerCase();

                                  return (

                                    <div
                                      key={
                                        emp.id
                                      }
                                      className="grid grid-cols-12 px-4 py-3 border-b border-[#1e2b44] items-center"
                                    >

                                      <div className="col-span-5">

                                        <p className="text-sm font-bold text-white truncate">
                                          {
                                            emp.full_name
                                          }
                                        </p>

                                      </div>

                                      <div className="col-span-4">

                                        <p className="text-xs text-slate-400 truncate">
                                          {emp.position ||
                                            'N/A'}
                                        </p>

                                      </div>

                                      <div className="col-span-3 flex justify-center">

                                        <div
                                          className={`
                                            h-2.5
                                            w-full
                                            rounded-full
                                            ${
                                              status ===
                                              'active'
                                                ? 'bg-green-500'
                                                : status ===
                                                  'inactive'
                                                ? 'bg-yellow-500'
                                                : 'bg-red-500'
                                            }
                                          `}
                                        />

                                      </div>

                                    </div>

                                  );

                                }
                              )

                            ) : (

                              <div className="py-16 text-center text-slate-500 italic">
                                {employeeSearch
                                  ? 'No matching employees'
                                  : 'No employees assigned'}
                              </div>

                            )}

                          </div>

                        </div>

                        {/* PAGINATION */}

                        <div className="flex items-center justify-center gap-5">

                          <button
                            onClick={() =>
                              setCurrentPage(
                                Math.max(
                                  1,
                                  currentPage -
                                    1
                                )
                              )
                            }
                            disabled={
                              currentPage ===
                              1
                            }
                            className="text-slate-500 disabled:opacity-30"
                          >

                            <ChevronLeft
                              size={
                                20
                              }
                            />

                          </button>

                          <span className="text-sm font-bold text-slate-400">
                            {
                              currentPage
                            }{' '}
                            /{' '}
                            {totalPages ||
                              1}
                          </span>

                          <button
                            onClick={() =>
                              setCurrentPage(
                                Math.min(
                                  totalPages,
                                  currentPage +
                                    1
                                )
                              )
                            }
                            disabled={
                              currentPage ===
                                totalPages ||
                              totalPages ===
                                0
                            }
                            className="text-slate-500 disabled:opacity-30"
                          >

                            <ChevronRight
                              size={
                                20
                              }
                            />

                          </button>

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
                            font-bold
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

                              <Navigation
                                size={
                                  18
                                }
                              />

                              Get Direction

                            </>

                          )}

                        </button>

                      </div>

                    </div>

                  ) : (

                    <div className="h-[700px] flex flex-col items-center justify-center text-center p-8">

                      <div className="h-24 w-24 rounded-[32px] bg-red-500/10 flex items-center justify-center mb-6">

                        <Building2
                          size={
                            42
                          }
                          className="text-red-500"
                        />

                      </div>

                      <h2 className="text-3xl font-black text-white">
                        Select a Hub
                      </h2>

                      <p className="text-slate-400 mt-3 max-w-sm">
                        Choose a hub
                        marker to
                        view employee
                        records,
                        analytics and
                        directions.
                      </p>

                    </div>

                  )}

                </Card>

              </div>

            </div>

            {/* HUB CARDS */}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

              {filteredHubs.map(
                (
                  hub
                ) => {

                  const employeeCount =
                    getHubEmployeeCount(
                      hub.id
                    );

                  return (

                    <div
                      key={
                        hub.id
                      }
                      onClick={() =>
                        handleMarkerClick(
                          hub
                        )
                      }
                      className="
                        rounded-[30px]
                        bg-[#1e293b]
                        border
                        border-white/10
                        p-6
                        hover:-translate-y-1
                        transition-all
                        cursor-pointer
                      "
                    >

                      <div className="flex justify-between items-start">

                        <div className="flex-1">

                          <div className="flex items-center gap-3">

                            <MapPin
                              size={
                                18
                              }
                              className="text-red-500"
                            />

                            <h3 className="font-black text-2xl text-white leading-tight">
                              {
                                hub.name
                              }
                            </h3>

                          </div>

                          <p className="text-xl font-bold text-slate-200 mt-4">
                            {
                              hub.city
                            }
                          </p>

                          <p className="text-sm text-slate-400 mt-3">
                            {
                              hub.address
                            }
                          </p>

                        </div>

                        <div className="text-right ml-4">

                          <h2 className="text-5xl font-black text-white leading-none">
                            {
                              employeeCount
                            }
                          </h2>

                          <p className="text-[11px] font-black uppercase tracking-widest text-slate-300 mt-2">
                            Staff
                          </p>

                        </div>

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          </div>

        </div>

      </>
    );

  };
