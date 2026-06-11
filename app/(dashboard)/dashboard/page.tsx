"use client";

import { useEffect, useState } from "react";
import Link from "next/navigation";
import { 
  Building, 
  Search, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  FileCheck, 
  Users2,
  FileQuestion,
  ExternalLink,
  Plus
} from "lucide-react";
import { PermitCase } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import SLATimer from "@/components/ui/SLATimer";

export default function DashboardPage() {
  const [cases, setCases] = useState<PermitCase[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    autoApproved: 0,
    pendingReview: 0,
    missingDocs: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cases/dashboard");
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter cases based on search and selected filters
  const filteredCases = cases.filter(c => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      c.applicant_name.toLowerCase().includes(query) ||
      c.site_address.toLowerCase().includes(query) ||
      c.case_id.toLowerCase().includes(query);
    
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesType = typeFilter === "ALL" || c.permit_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Closed":
      case "Approved":
        return "bg-green-100 text-green-700 border-green-300";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-300";
      case "HumanReview":
        return "bg-amber-100 text-amber-700 border-amber-300 animate-pulse";
      case "DocumentsRequested":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-stone-100 text-stone-600 border-stone-300";
    }
  };

  // Extract recent activities from all case audit logs
  const allActivities = cases
    .flatMap(c => 
      c.audit_log.map(log => ({
        ...log,
        case_id: c.case_id,
        applicant_name: c.applicant_name,
        permit_type: c.permit_type
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-orange-50 text-stone-800 py-12 px-4 relative">{/* Background removed */}

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 border-b border-orange-200 pb-8">
          <div>
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-black tracking-tight text-orange-600">
                Municipal Officer Dashboard
              </h1>
            </div>
            <p className="text-stone-600 mt-1 text-sm">
              GeoPermit AI zoning orchestrator & exception processing center.
            </p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="px-4 py-2.5 bg-white border-2 border-orange-200 rounded-xl hover:bg-orange-50 transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-600" : ""}`} /> Refresh
            </button>
            <a
              href="/submit"
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 rounded-xl transition-all flex items-center gap-2 text-sm font-bold text-white shadow-sm"
            >
              <Plus className="w-4 h-4" /> Submit Application
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            title="Total Cases" 
            value={stats.total} 
            icon={<TrendingUp className="w-5 h-5" />} 
            color="text-orange-600"
            bgColor="bg-orange-100 border-orange-200"
          />
          <StatCard 
            title="Auto-Approved" 
            value={stats.autoApproved} 
            icon={<FileCheck className="w-5 h-5" />} 
            color="text-green-600"
            bgColor="bg-green-100 border-green-200"
          />
          <StatCard 
            title="Pending Review" 
            value={stats.pendingReview} 
            icon={<Users2 className="w-5 h-5" />} 
            color="text-amber-600"
            bgColor="bg-amber-100 border-amber-200"
            animate={stats.pendingReview > 0}
          />
          <StatCard 
            title="Missing Documents" 
            value={stats.missingDocs} 
            icon={<FileQuestion className="w-5 h-5" />} 
            color="text-blue-600"
            bgColor="bg-blue-100 border-blue-200"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Columns (2/3 width): Case Table */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Filters Bar */}
            <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search input */}
              <div className="w-full md:w-1/3 relative">
                <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, address, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-orange-50 border-2 border-orange-200 rounded-xl pl-10 pr-4 py-2 text-stone-800 placeholder-stone-500 focus:outline-none focus:border-orange-400 text-xs"
                />
              </div>

              {/* Select filters */}
              <div className="flex gap-3 w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-orange-50 border-2 border-orange-200 rounded-xl px-3 py-2 text-stone-700 text-xs focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="HumanReview">Pending Officer Review</option>
                  <option value="DocumentsRequested">Missing Documents</option>
                  <option value="Closed">Closed / Completed</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-orange-50 border-2 border-orange-200 rounded-xl px-3 py-2 text-stone-700 text-xs focus:outline-none"
                >
                  <option value="ALL">All Permit Types</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Mixed-Use">Mixed-Use</option>
                </select>
              </div>
            </div>

            {/* Cases list */}
            <div className="bg-white border-2 border-orange-200 rounded-2xl overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-20 text-center text-stone-500">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-600 mb-2" />
                  <p className="text-sm">Retrieving case files...</p>
                </div>
              ) : filteredCases.length === 0 ? (
                <div className="p-20 text-center text-stone-500">
                  <AlertCircle className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                  <p className="text-sm">No cases match the selected filters.</p>
                </div>
              ) : (
                <div className="divide-y divide-orange-200">
                  {filteredCases.map((c) => (
                    <div 
                      key={c.case_id}
                      className="p-6 hover:bg-orange-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                    >
                      <div className="flex-1 flex flex-col gap-2.5">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border-2 rounded-full ${getStatusBadgeStyle(c.status)}`}>
                            {c.status === "Closed" && c.officer_decision ? c.officer_decision : c.status}
                          </span>
                          <span className="text-[10px] text-stone-500 font-mono">ID: {c.case_id.slice(0, 8)}...</span>
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-stone-900">{c.applicant_name}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                            <span>{c.site_address}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-600 mt-0.5">
                          <span className="text-orange-700 font-semibold bg-orange-100 px-2 py-0.5 rounded border-2 border-orange-200 text-[10px]">
                            {c.permit_type}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-stone-500">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                          
                          {c.zone_conflict && (
                            <span className="text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded border-2 border-rose-300 text-[10px] animate-pulse">
                              ZONAL CONFLICT
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 border-orange-200 pt-4 md:pt-0">
                        {/* SLA timer */}
                        <SLATimer deadline={c.sla_deadline} status={c.status} />
                        
                        <a
                          href={`/cases/${c.case_id}`}
                          className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 hover:underline"
                        >
                          Review Case <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1/3 width): Activity Feed */}
          <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6 self-start">
            <h3 className="text-md font-bold text-stone-800 border-b border-orange-200 pb-3 flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-orange-600" /> System Orchestrator Log
            </h3>
            
            <div className="flex flex-col gap-5 max-h-[600px] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-center py-10 text-stone-500 text-xs">Loading logs...</div>
              ) : allActivities.length === 0 ? (
                <div className="text-center py-10 text-stone-500 text-xs">No logs available.</div>
              ) : (
                allActivities.map((act, idx) => (
                  <div key={idx} className="flex gap-3 text-xs relative">
                    {/* Vertical timeline line */}
                    {idx < allActivities.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-[-20px] w-[2px] bg-orange-200" />
                    )}
                    
                    {/* Log bullet */}
                    <div className={`w-[24px] h-[24px] rounded-full shrink-0 border-2 flex items-center justify-center font-bold text-[9px] ${
                      act.actor === "RPA Notification Bot" 
                        ? "bg-green-100 border-green-400 text-green-700" 
                        : act.actor === "GIS Compliance Agent" 
                        ? "bg-blue-100 border-blue-400 text-blue-700"
                        : act.actor.includes("Officer") 
                        ? "bg-amber-100 border-amber-400 text-amber-700"
                        : "bg-orange-50 border-orange-300 text-stone-600"
                    }`}>
                      {act.actor.slice(0, 1)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-stone-800">{act.actor}</span>
                        <span className="text-[9px] text-stone-500">{formatDateTime(act.timestamp)}</span>
                      </div>
                      <div className="text-orange-600 font-semibold mt-0.5 text-[10px] uppercase tracking-wider">{act.action}</div>
                      <p className="text-stone-600 mt-1 leading-relaxed text-[11px] bg-orange-50 p-2 rounded-lg border border-orange-200 mt-1.5">
                        {act.details}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-stone-500">
                        <span>Case:</span>
                        <a href={`/cases/${act.case_id}`} className="hover:underline hover:text-orange-600 font-mono">
                          {act.applicant_name} ({act.case_id.slice(0, 6)})
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color, 
  bgColor,
  animate = false 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
  bgColor: string;
  animate?: boolean;
}) {
  return (
    <div className={`p-6 border-2 rounded-2xl flex items-center justify-between shadow-sm transition-transform hover:scale-[1.01] ${bgColor} ${
      animate ? "ring-2 ring-amber-400" : ""
    }`}>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">{title}</span>
        <span className="text-3xl font-black tracking-tight text-stone-900">{value}</span>
      </div>
      <div className={`p-3 bg-white rounded-xl border-2 ${color}`}>
        {icon}
      </div>
    </div>
  );
}
