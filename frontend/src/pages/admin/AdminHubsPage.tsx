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
  Plus
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

// ===============================
// CONSTANTS
// ===============================

const OSRM_BASE =
  'https://router.project-osrm.org/route/v1';

const WALKING_SPEED_KMH = 4.8;
const CYCLING_SPEED_KMH = 15;
const DRIVING_SPEED_KMH = 35;

// ===============================
// TYPES
// ===============================

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

// ===============================
// UTILITIES
// ===============================

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

// ===============================
// OSRM PARSER
// ===============================

function parseOsrmResponse(
  data: unknown,
  mode:
    | 'walking'
    | 'cycling'
    | 'driving'
): ParsedOsrmRoute | null {

  const routeData = data as {
    routes?: Array<{
      distance: number;
      duration: number;
      geometry: {
        coordinates: [number, number][];
      };
      legs?: Array<{
        steps?: Array<{
          distance?: number;
          duration?: number;
          maneuver?: {
            instruction?: string;
            type?: string;
          };
        }>;
      }>;
    }>;
  };

  if (
    !routeData?.routes?.length
  ) {
    return null;
  }

  const route =
    routeData.routes[0];

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
    (leg) => {

      leg.steps?.forEach(
        (step) => {

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

// ===============================
// FETCH ROUTE
// ===============================

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

// ===============================
// MAIN COMPONENT
// ===============================

export const AdminHubsPage =
  () => {

    useAuth();

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

    const itemsPerPage = 10;

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
      routeData,
      setRouteData
    ] = useState<{
      walking: ParsedOsrmRoute;
      riding: ParsedOsrmRoute;
      car: ParsedOsrmRoute;
    } | null>(null);

    const [
      weatherData,
      setWeatherData
    ] =
      useState<WeatherData | null>(
        null
      );

    const [
      loadingRoute,
      setLoadingRoute
    ] = useState(false);

    const mapRef =
      useRef<L.Map | null>(
        null
      );

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

    // ===============================
    // GEOLOCATION
    // ===============================

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

    // ===============================
    // WEATHER
    // ===============================

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
              weather
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

    // ===============================
    // COORDS
    // ===============================

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
        14.6760,
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

    // ===============================
    // ICONS
    // ===============================

    const hubIcon =
      useMemo(
        () =>
          L.divIcon({
            className:
              'custom-hub-marker',

            html: `
            <div
              style="
                width:22px;
                height:22px;
                background:#dc2626;
                border-radius:999px;
                border:4px solid white;
                box-shadow:0 8px 20px rgba(220,38,38,.4);
              "
            ></div>
          `,

            iconSize: [
              22,
              22
            ]
          }),
        []
      );

    const userIcon =
      useMemo(
        () =>
          L.divIcon({
            className:
              'custom-user-marker',

            html: `
            <div
              style="
                width:22px;
                height:22px;
                background:#2563eb;
                border-radius:999px;
                border:4px solid white;
                box-shadow:0 8px 20px rgba(37,99,235,.4);
              "
            ></div>
          `,

            iconSize: [
              22,
              22
            ]
          }),
        []
      );

    // ===============================
    // FILTERED HUBS
    // ===============================

    const filteredHubs =
      useMemo(() => {

        return hubs.filter(
          (
            hub: Hub
          ) =>
            !searchTerm ||

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

    const totalPages =
      Math.ceil(
        hubEmployeesData.length /
          itemsPerPage
      );

    const paginatedEmployees =
      useMemo(() => {

        const startIdx =
          (currentPage - 1) *
          itemsPerPage;

        return hubEmployeesData.slice(
          startIdx,
          startIdx +
            itemsPerPage
        );

      }, [
        hubEmployeesData,
        currentPage
      ]);

    // ===============================
    // ROUTES
    // ===============================

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

    // ===============================
    // LOADING
    // ===============================

    if (isLoading) {

      return (
        <div className="min-h-screen bg-gray-50">

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

          <div className="p-4 lg:p-6 lg:ml-64 flex items-center justify-center min-h-[50vh]">

            <LoadingSpinner />

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
          open={
            sidebarOpen
          }
          onToggle={() =>
            setSidebarOpen(
              !sidebarOpen
            )
          }
        />

        <div className="p-4 lg:p-6 lg:ml-64 space-y-5">

          {/* HEADER */}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div>

              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Hub Management
              </h1>

              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {
                  filteredHubs.length
                }{' '}
                hub locations
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
                font-semibold
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

          <Card className="rounded-3xl p-5">

            <div className="relative">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search hubs..."
                value={
                  searchTerm
                }
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>
                ) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                className="
                  w-full
                  h-14
                  rounded-2xl
                  bg-gray-50
                  dark:bg-gray-800
                  border
                  border-gray-200
                  dark:border-gray-700
                  pl-12
                  pr-4
                  outline-none
                  focus:ring-4
                  focus:ring-red-500/10
                "
              />

            </div>

          </Card>

          {/* ROUTE ANALYTICS */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {routeData ? (

              <>
                {[
                  {
                    title:
                      'Driving',
                    icon: Car,
                    color:
                      'bg-red-600',
                    data:
                      routeData.car
                  },

                  {
                    title:
                      'Cycling',
                    icon: Bike,
                    color:
                      'bg-blue-600',
                    data:
                      routeData.riding
                  },

                  {
                    title:
                      'Walking',
                    icon:
                      Footprints,
                    color:
                      'bg-emerald-600',
                    data:
                      routeData.walking
                  }

                ].map(
                  (
                    item
                  ) => (

                    <Card
                      key={
                        item.title
                      }
                      className="rounded-3xl p-5"
                    >

                      <div
                        className={`
                          h-14
                          w-14
                          rounded-2xl
                          ${item.color}
                          flex
                          items-center
                          justify-center
                          text-white
                          mb-4
                        `}
                      >
                        <item.icon
                          size={
                            24
                          }
                        />
                      </div>

                      <p className="text-gray-500 text-sm">
                        {
                          item.title
                        }
                      </p>

                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {formatDistance(
                          item.data
                            .distanceM
                        )}
                      </h2>

                      <p className="text-sm text-gray-500 mt-2">
                        {formatDuration(
                          item.data
                            .durationSec
                        )}
                      </p>

                    </Card>

                  )
                )}
              </>

            ) : (

              <div className="md:col-span-3 rounded-3xl border border-dashed border-gray-300 bg-white dark:bg-gray-900 h-40 flex items-center justify-center text-gray-400">

                Select a hub to generate route analytics

              </div>

            )}

          </div>

          {/* MAP + SIDEBAR */}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

            {/* MAP */}

            <div className="xl:col-span-8 rounded-[32px] overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">

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
                        Your Location
                      </Popup>

                    </Marker>

                  )}

                  {filteredHubs.map(
                    (
                      hub: Hub
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
                    routeData && (

                      <Polyline
                        positions={
                          routeData
                            .car
                            .coordinates
                        }
                        color="#dc2626"
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

              <Card className="rounded-[32px] overflow-hidden h-full">

                {hubState.selectedHub ? (

                  <div>

                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">

                      <div>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {
                            hubState
                              .selectedHub
                              .name
                          }
                        </h2>

                        <p className="text-gray-500 mt-1">
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
                        className="h-11 w-11 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
                      >

                        <X size={20} />

                      </button>

                    </div>

                    <div className="p-6 space-y-5">

                      {weatherData && (

                        <div className="rounded-3xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 p-5">

                          <div className="flex items-center gap-4">

                            <div className="h-16 w-16 rounded-3xl bg-white dark:bg-gray-900 flex items-center justify-center text-3xl">
                              {
                                weatherData.icon
                              }
                            </div>

                            <div>

                              <p className="text-gray-500 text-sm">
                                Current Weather
                              </p>

                              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {
                                  weatherData.temp
                                }
                                °C
                              </h2>

                              <p className="text-gray-600 dark:text-gray-400">
                                {
                                  weatherData.label
                                }
                              </p>

                            </div>

                          </div>

                        </div>

                      )}

                      <div className="grid grid-cols-2 gap-4">

                        <div className="rounded-3xl bg-gray-50 dark:bg-gray-800 p-5">

                          <Users
                            size={
                              22
                            }
                            className="text-red-500 mb-3"
                          />

                          <p className="text-gray-500 text-sm">
                            Employees
                          </p>

                          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                            {
                              hubEmployeesData.length
                            }
                          </h2>

                        </div>

                        <div className="rounded-3xl bg-gray-50 dark:bg-gray-800 p-5">

                          <MapPin
                            size={
                              22
                            }
                            className="text-blue-500 mb-3"
                          />

                          <p className="text-gray-500 text-sm">
                            City
                          </p>

                          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                            {
                              hubState
                                .selectedHub
                                .city
                            }
                          </h2>

                        </div>

                      </div>

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
                          bg-red-600
                          hover:bg-red-700
                          text-white
                          font-semibold
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
                            <Navigation size={18} />
                            Get Directions
                          </>

                        )}

                      </button>

                    </div>

                  </div>

                ) : (

                  <div className="h-[700px] flex flex-col items-center justify-center text-center p-8">

                    <div className="h-24 w-24 rounded-[32px] bg-red-100 flex items-center justify-center mb-6">

                      <MapPin
                        size={
                          40
                        }
                        className="text-red-500"
                      />

                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Select a Hub
                    </h2>

                    <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-sm">

                      Choose a hub marker from the map to see employees and route analytics.

                    </p>

                  </div>

                )}

              </Card>

            </div>

          </div>

        </div>

      </>
    );
};

