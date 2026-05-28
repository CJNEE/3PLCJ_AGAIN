import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
} from 'react';

import { Card, LoadingSpinner } from '@/components/common';
import { GlassCard } from '@/components/GlassCard';

import {
  useGetHubs,
  useGetEmployees,
  useCreateHub,
  useDeleteHub,
  useUpdateHub,
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
} from 'lucide-react';

import { normalizeApiResponse } from '@/utils/apiResponseHandler';

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
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

  const mapRef = useRef<L.Map | null>(null);

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
    allEmployees,
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

        </div>
      </div>
    </>
  );
};
