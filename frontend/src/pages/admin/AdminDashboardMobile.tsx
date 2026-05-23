import React, { useState, useMemo } from 'react';

import {
  useGetEmployees,
  useGetHubs,
  useGetActivityLogs,
} from '@/hooks/useQueries';
import { LoadingSpinner } from '@/components/common';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Users,
  MapPin,
  X,
  User,
  Phone,
  Briefcase,
  Shield,
  Landmark,
  Clock,
  Search,
  TrendingUp,
  Activity,
  Eye,
  Building2,
} from 'lucide-react';
import type { Employee, Hub } from '@/types';

/* ─── colour maps ────────────────────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  Active: '#10B981',
  AWOL: '#F59E0B',
  Blacklist: '#EF4444',
  Resign: '#3B82F6',
};

const EMPLOYMENT_TYPE_COLORS: Record<string, string> = {
  'Full-time': '#C41E3A',
  'Full time': '#C41E3A',
  OCW: '#3B82F6',
};

/* ─── custom hub map marker ──────────────────────────────────── */
const hubIcon = L.divIcon({
  className: 'custom-hub-marker',
  html: `
    <div style="width:28px;height:28px;position:relative;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:28px;height:28px;background:rgba(196,30,58,0.3);border-radius:50%;animation:ping 1s cubic-bezier(0,0,.2,1) infinite;"></div>
      <div style="position:relative;width:22px;height:22px;background:#C41E3A;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

/* ─── city coord fallbacks ───────────────────────────────────── */
const CITY_COORDS: Record<string, [number, number]> = {
  manila: [14.5995, 120.9842],
  quezon: [14.8291, 121.2558],
  cebu: [10.3157, 123.8854],
  davao: [7.0731, 125.6121],
  cagayan: [17.6412, 121.774],
  pampanga: [15.0955, 120.665],
  laguna: [14.3159, 121.4158],
  batangas: [13.7563, 121.0437],
};

function getHubCoordinates(hub: Hub): [number, number] {
  if (hub.latitude && hub.longitude) return [hub.latitude, hub.longitude];
  const city = hub.city?.toLowerCase() || '';
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (city.includes(key)) return coords;
  }
  return [12.5797, 124.0758];
}

/* ─── reusable section header ────────────────────────────────── */
const SectionHeader = ({
  icon: Icon,
  title,
  accent = '#C41E3A',
}: {
  icon: React.ElementType;
  title: string;
  accent?: string;
}) => (
  <div className="flex items-center gap-2 mb-3">
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center"
      style={{ background: accent + '22' }}
    >
      <Icon size={14} style={{ color: accent }} />
    </div>
    <h2 className="text-sm font-bold text-white tracking-wide">{title}</h2>
  </div>
);

/* ─── employee modal ─────────────────────────────────────────── */
type SelectedEmployee = (Omit<Partial<Employee>, 'id'> & { id?: string | number }) | null;

const EmployeeDetailModal = ({
  employee,
  onClose,
}: {
  employee: SelectedEmployee;
  onClose: () => void;
}) => {
  if (!employee) return null;

  const Field = ({ label, value }: { label: string; value?: string | number | boolean | null }) => (
    <div className="flex flex-col gap-0.5">
      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-semibold text-white">{value != null && value !== '' ? String(value) : 'N/A'}</p>
    </div>
  );

  const Section = ({
    icon: Icon,
    title,
    children,
  }: {
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-[#0F172A] rounded-2xl border border-gray-800 p-4 space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
        <Icon size={14} className="text-red-500" />
        <h3 className="text-xs font-black uppercase tracking-wider text-white">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-[#060D1A]"
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Header banner */}
      <div className="relative shrink-0 bg-gradient-to-r from-red-900 to-red-700 p-5 pt-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-all"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4">
          {employee.profile_image ? (
            <img
              src={employee.profile_image}
              alt={employee.full_name}
              className="w-16 h-16 rounded-xl object-cover border-2 border-white/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-2xl font-black text-white shrink-0">
              {employee.full_name?.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-white leading-tight">{employee.full_name}</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white ${
                  employee.status?.toLowerCase() === 'active' ? 'bg-green-500' : 'bg-amber-500'
                }`}
              >
                {employee.status}
              </span>
            </div>
            <p className="text-red-200 text-xs mt-0.5">
              {employee.position} · {employee.hub_name || 'No Hub'}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-md bg-black/20 text-white/90 text-[10px] font-semibold">
                {employee.employment_type || 'N/A'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-black/20 text-white/90 text-[10px] font-semibold">
                ID: {employee.employee_id || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-6">
        <Section icon={User} title="Personal Info">
          <Field label="First Name" value={employee.firstname} />
          <Field label="Last Name" value={employee.lastname} />
          <Field label="Middle Initial" value={employee.middle_initial} />
          <Field label="Gender" value={employee.gender} />
          <Field label="Date of Birth" value={employee.date_of_birth} />
          <Field label="Place of Birth" value={employee.place_of_birth} />
          <Field label="Nationality" value={employee.nationality} />
          <Field label="Marital Status" value={employee.marital_status} />
        </Section>

        <Section icon={Phone} title="Contact Info">
          <div className="col-span-2">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Email</p>
            <p className="text-xs font-semibold text-white break-all">{employee.email_address || 'N/A'}</p>
          </div>
          <Field label="Phone" value={employee.phone_number} />
          <div className="col-span-2">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Current Address</p>
            <p className="text-xs font-semibold text-white">{employee.current_address || 'N/A'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Permanent Address</p>
            <p className="text-xs font-semibold text-white">{employee.permanent_address || 'N/A'}</p>
          </div>
          <Field label="Emergency Contact" value={employee.emergency_contact_name} />
          <Field label="Emergency Phone" value={employee.emergency_contact_phone} />
        </Section>

        <Section icon={Briefcase} title="Employment Info">
          <Field label="Position" value={employee.position} />
          <Field label="Employment Type" value={employee.employment_type} />
          <Field label="Hub" value={employee.hub_name} />
          <Field label="Hired Date" value={employee.hired_date} />
          <Field label="Employee ID" value={employee.employee_id} />
          <Field label="JTP Code" value={employee.jtp_code} />
        </Section>

        <Section icon={Landmark} title="Government IDs">
          <Field label="TIN" value={employee.tin} />
          <Field label="SSS" value={employee.sss} />
          <Field label="PhilHealth" value={employee.philhealth} />
          <Field label="PAG-IBIG" value={employee.pagibig} />
        </Section>

        <Section icon={Shield} title="Permissions">
          <div className="col-span-2 flex flex-wrap gap-2">
            {[
              { label: 'Can Login', val: employee.can_login },
              { label: 'Can Edit Info', val: employee.can_edit_info },
              { label: 'Is Active', val: employee.is_active },
            ].map(({ label, val }) => (
              <span
                key={label}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                  val
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
              >
                {label}: {val ? 'Yes' : 'No'}
              </span>
            ))}
          </div>
        </Section>

        {employee.latest_clock_in_out && (
          <Section icon={Clock} title="Latest Clock In/Out">
            <Field label="Clock In" value={employee.latest_clock_in_out.clock_in} />
            <Field label="Clock Out" value={employee.latest_clock_in_out.clock_out} />
          </Section>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export const AdminDashboardMobile = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHubTerm, setSearchHubTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<SelectedEmployee>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'hubs'>('overview');

  /* ── data ── */
  const employeesQuery = useGetEmployees({ hub_id: null });
  const hubsQuery = useGetHubs();
  const activityLogsQuery = useGetActivityLogs({ limit: 5 });

  const isLoading = employeesQuery.isLoading || hubsQuery.isLoading;

  const allEmployees = normalizeApiResponse(employeesQuery.data) as Employee[];
  const hubs = normalizeApiResponse(hubsQuery.data) as Hub[];
  const totalEmployees = allEmployees.length;
  const totalHubs = hubs.length;
  const activeCount = allEmployees.filter((e) => e.status === 'Active').length;
  const resignCount = allEmployees.filter((e) => e.status === 'Resign').length;

  /* ── filtered employees ── */
  const employees = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return allEmployees.filter(
      (e) =>
        e.full_name?.toLowerCase().includes(q) ||
        e.employee_id?.toLowerCase().includes(q)
    ) as Array<Omit<Partial<Employee>, 'id'> & { id?: string | number }>;
  }, [allEmployees, searchTerm]);

  /* ── filtered hubs ── */
  const filteredHubs = useMemo(() => {
    const q = searchHubTerm.toLowerCase();
    return hubs.filter(
      (h) =>
        !q ||
        h.name?.toLowerCase().includes(q) ||
        h.location?.toLowerCase().includes(q) ||
        h.city?.toLowerCase().includes(q)
    );
  }, [hubs, searchHubTerm]);

  /* ── chart data ── */
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    allEmployees.forEach((e) => {
      const s = e.status || 'Active';
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allEmployees]);

  const employmentTypeData = useMemo(() => {
    const map: Record<string, number> = {};
    allEmployees.forEach((e) => {
      if (!e.employment_type) return;
      map[e.employment_type] = (map[e.employment_type] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allEmployees]);

  /* ── loading ── */
  if (isLoading) {
    return (
      <div className="lg:hidden flex items-center justify-center min-h-screen bg-[#060D1A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="lg:hidden flex flex-col min-h-screen bg-[#060D1A] text-white">
      {/* Employee modal (full-screen) */}
      {showEmployeeModal && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => {
            setShowEmployeeModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}

      {/* Header */}
      <MobileHeader />

      {/* Page subtitle */}
      <div className="px-4 pt-3 pb-1">
        <h1 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          3PL Business Solutions · Admin Overview
        </h1>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 px-4 py-2">
        {(['overview', 'employees', 'hubs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg shadow-red-900/30'
                : 'bg-[#0F172A] text-gray-400 border border-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Scrollable main ── */}
      <main className="flex-1 overflow-y-auto px-4 pb-24 space-y-4 pt-2">

        {/* ════════ OVERVIEW TAB ════════ */}
        {activeTab === 'overview' && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Employees', value: totalEmployees, icon: Users, color: '#C41E3A' },
                { label: 'Total Hubs', value: totalHubs, icon: Building2, color: '#C41E3A' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="bg-[#0B1220] rounded-2xl border border-gray-800 p-4 flex flex-col items-center justify-center gap-1 shadow-lg"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center mb-1"
                    style={{ background: color + '22' }}
                  >
                    <Icon size={16} style={{ color }} />
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold text-center">
                    {label}
                  </p>
                  <p className="text-4xl font-black" style={{ color }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0B1220] rounded-2xl border border-gray-800 p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Activity size={14} className="text-green-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Active</p>
                  <p className="text-xl font-black text-green-400">{activeCount}</p>
                </div>
              </div>
              <div className="bg-[#0B1220] rounded-2xl border border-gray-800 p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp size={14} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Resign</p>
                  <p className="text-xl font-black text-blue-400">{resignCount}</p>
                </div>
              </div>
            </div>

            {/* Employee Status – Pie chart */}
            <div className="bg-[#0B1220] rounded-2xl border border-gray-800 p-4">
              <SectionHeader icon={Activity} title="Employee Status" />
              {statusData.length > 0 ? (
                <div className="flex items-center gap-2">
                  <ResponsiveContainer width="50%" height={130}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={50}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={STATUS_COLORS[entry.name] || '#3B82F6'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#0F172A', border: '1px solid #374151', borderRadius: 8, color: '#fff', fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2 flex-1">
                    {statusData.map((entry, i) => {
                      const total = statusData.reduce((s, x) => s + x.value, 0);
                      const pct = Math.round((entry.value / total) * 100);
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: STATUS_COLORS[entry.name] || '#3B82F6' }}
                          />
                          <span className="text-[11px] text-gray-400 flex-1">{entry.name}</span>
                          <span className="text-[11px] font-bold text-white">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-xs text-center py-4">No data</p>
              )}
            </div>

            {/* Employment Type */}
            <div className="bg-[#0B1220] rounded-2xl border border-gray-800 p-4">
              <SectionHeader icon={Briefcase} title="Employment Type" />
              {employmentTypeData.length > 0 ? (
                <div className="space-y-3">
                  {employmentTypeData.map((entry, i) => {
                    const maxVal = Math.max(...employmentTypeData.map((d) => d.value), 1);
                    const pct = Math.round((entry.value / maxVal) * 100);
                    return (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-300">{entry.name}</span>
                          <span className="text-xs text-gray-400 tabular-nums">
                            {entry.value}{' '}
                            <span className="text-gray-600">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: EMPLOYMENT_TYPE_COLORS[entry.name] || '#3B82F6',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-xs text-center py-4">No data</p>
              )}
            </div>

            {/* Workforce Status */}
            <div className="bg-[#0B1220] rounded-2xl border border-gray-800 p-4">
              <SectionHeader icon={Shield} title="Workforce Status" />
              <div className="space-y-2">
                {statusData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: STATUS_COLORS[item.name] || '#3B82F6' }}
                      />
                      <span className="text-xs text-gray-400">{item.name}</span>
                    </div>
                    <span
                      className="text-lg font-black"
                      style={{ color: STATUS_COLORS[item.name] || '#3B82F6' }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hub Locations Map */}
            <div className="bg-[#0B1220] rounded-2xl border border-gray-800 overflow-hidden">
              <div className="flex items-center gap-2 p-4 pb-3">
                <div className="w-7 h-7 rounded-lg bg-red-600/20 flex items-center justify-center">
                  <MapPin size={14} className="text-red-500" />
                </div>
                <h2 className="text-sm font-bold text-white">Hub Locations</h2>
              </div>
              <div style={{ height: 260 }}>
                {hubs.length > 0 ? (
                  <MapContainer
                    center={[12.5797, 124.0758]}
                    zoom={5}
                    style={{ width: '100%', height: '100%' }}
                    zoomControl={false}
                    attributionControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {hubs.map((hub) => {
                      const [lat, lng] = getHubCoordinates(hub);
                      const empCount = allEmployees.filter((e) => e.hub === hub.id).length;
                      return (
                        <Marker key={hub.id} position={[lat, lng]} icon={hubIcon}>
                          <Popup>
                            <div className="text-xs">
                              <p className="font-bold">{hub.name}</p>
                              <p className="text-gray-600">{hub.location || hub.city}</p>
                              <p className="text-gray-500 mt-0.5">{empCount} employees</p>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-900">
                    <p className="text-gray-500 text-xs">No hub locations available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#0B1220] rounded-2xl border border-gray-800 p-4">
              <SectionHeader icon={Activity} title="Recent Activity" />
              {activityLogsQuery.isLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : activityLogsQuery.data && activityLogsQuery.data.length > 0 ? (
                <ul className="space-y-2">
                  {activityLogsQuery.data.map((log: any, i: number) => (
                    <li key={i} className="flex items-start gap-2 py-1.5 border-b border-gray-800 last:border-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-white">{log.action}</p>
                        <p className="text-[10px] text-gray-500">{log.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-xs text-center py-4">No recent activity</p>
              )}
            </div>
          </>
        )}

        {/* ════════ EMPLOYEES TAB ════════ */}
        {activeTab === 'employees' && (
          <>
            <SectionHeader icon={Users} title={`Employees (${allEmployees.length})`} />

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0F172A] border border-gray-700 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>

            {/* Employee cards */}
            {employees.length > 0 ? (
              <div className="space-y-2">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="bg-[#0B1220] rounded-2xl border border-gray-800 p-3.5 flex items-center gap-3"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-red-700/20 border border-red-700/30 flex items-center justify-center text-base font-black text-red-400 shrink-0">
                      {emp.full_name?.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{emp.full_name}</p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {emp.position} · {emp.hub_name || 'No Hub'}
                      </p>
                    </div>

                    {/* Status + action */}
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black text-white ${
                          emp.status === 'Active'
                            ? 'bg-green-600'
                            : emp.status === 'AWOL'
                            ? 'bg-amber-500'
                            : emp.status === 'Blacklist'
                            ? 'bg-red-600'
                            : 'bg-blue-600'
                        }`}
                      >
                        {emp.status}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setShowEmployeeModal(true);
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300"
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No employees found</p>
              </div>
            )}
          </>
        )}

        {/* ════════ HUBS TAB ════════ */}
        {activeTab === 'hubs' && (
          <>
            <SectionHeader icon={MapPin} title={`Hubs (${hubs.length})`} />

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search hubs..."
                value={searchHubTerm}
                onChange={(e) => setSearchHubTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0F172A] border border-gray-700 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>

            {/* Hub cards */}
            {filteredHubs.length > 0 ? (
              <div className="space-y-2">
                {filteredHubs.map((hub) => {
                  const empCount = allEmployees.filter((e) => e.hub === hub.id).length;
                  return (
                    <div
                      key={hub.id}
                      className="bg-[#0B1220] rounded-2xl border border-gray-800 p-3.5 flex items-center gap-3"
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-red-700/20 border border-red-700/30 flex items-center justify-center shrink-0">
                        <MapPin size={16} className="text-red-500" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{hub.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {hub.location || hub.city || 'No location'}
                        </p>
                      </div>

                      {/* Employee count */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xl font-black text-red-500">{empCount}</span>
                        <span className="text-[9px] text-gray-600 uppercase tracking-wider">Employees</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hubs found</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom nav */}
      <MobileBottomNav />
    </div>
  );
};
