import React, { useState, useEffect } from 'react';
import { AdminDashboardStats, AdminApplicationSummary, ApplicationStatus } from '../../types';
import { api } from '../../lib/api';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ArrowRight, 
  Eye, 
  RefreshCw,
  Truck,
  Users
} from 'lucide-react';

interface AdminDashboardProps {
  onSelectApplication: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSelectApplication
}) => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [applications, setApplications] = useState<AdminApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminDashboard();
      setStats(data.stats);
      setApplications(data.applications);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredApplications = applications.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (app.driverName || '').toLowerCase().includes(q);
      const matchEmail = (app.driverEmail || '').toLowerCase().includes(q);
      const matchId = (app.id || '').toLowerCase().includes(q);
      const matchVehicle = (app.vehicleType || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchId || matchVehicle;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Courier Driver Applications
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
              Admin Portal
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Review submitted credential packets, verify documents, and issue compliance decisions.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition flex items-center gap-2 text-xs font-medium self-start sm:self-center cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total */}
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              statusFilter === 'all' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Total Apps
            </span>
            <Users className={`w-4 h-4 ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl font-bold mt-2">{stats?.totalApplications || 0}</div>
        </div>

        {/* Submitted */}
        <div 
          onClick={() => setStatusFilter('submitted')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'submitted'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-slate-900 border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              statusFilter === 'submitted' ? 'text-amber-100' : 'text-amber-700'
            }`}>
              Submitted
            </span>
            <Clock className={`w-4 h-4 ${statusFilter === 'submitted' ? 'text-amber-200' : 'text-amber-600'}`} />
          </div>
          <div className="text-2xl font-bold mt-2">{stats?.submitted || 0}</div>
        </div>

        {/* Under Review */}
        <div 
          onClick={() => setStatusFilter('under_review')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'under_review'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-900 border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              statusFilter === 'under_review' ? 'text-blue-100' : 'text-blue-700'
            }`}>
              Under Review
            </span>
            <FileText className={`w-4 h-4 ${statusFilter === 'under_review' ? 'text-blue-200' : 'text-blue-600'}`} />
          </div>
          <div className="text-2xl font-bold mt-2">{stats?.underReview || 0}</div>
        </div>

        {/* Approved */}
        <div 
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'approved'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              statusFilter === 'approved' ? 'text-emerald-100' : 'text-emerald-700'
            }`}>
              Approved
            </span>
            <CheckCircle2 className={`w-4 h-4 ${statusFilter === 'approved' ? 'text-emerald-200' : 'text-emerald-600'}`} />
          </div>
          <div className="text-2xl font-bold mt-2">{stats?.approved || 0}</div>
        </div>

        {/* Rejected */}
        <div 
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'rejected'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white text-slate-900 border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              statusFilter === 'rejected' ? 'text-rose-100' : 'text-rose-700'
            }`}>
              Rejected
            </span>
            <XCircle className={`w-4 h-4 ${statusFilter === 'rejected' ? 'text-rose-200' : 'text-rose-600'}`} />
          </div>
          <div className="text-2xl font-bold mt-2">{stats?.rejected || 0}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by driver name, email, ID..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'submitted', label: 'Submitted' },
            { id: 'under_review', label: 'Under Review' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'draft', label: 'Draft' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Driver</th>
                <th className="px-5 py-3.5">Vehicle</th>
                <th className="px-5 py-3.5">Application ID</th>
                <th className="px-5 py-3.5">Submitted</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplications.length > 0 ? (
                filteredApplications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Driver */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 text-sm">{app.driverName}</div>
                      <div className="text-slate-500 text-[11px]">{app.driverEmail} · {app.driverPhone}</div>
                    </td>

                    {/* Vehicle */}
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                        <Truck className="w-3.5 h-3.5 text-slate-500" />
                        <span>{app.vehicleType}</span>
                      </div>
                    </td>

                    {/* App ID */}
                    <td className="px-5 py-4 font-mono text-slate-600">
                      {app.id}
                      <span className="block text-[10px] text-slate-400 font-sans">
                        {app.documentCount} docs uploaded
                      </span>
                    </td>

                    {/* Submitted date */}
                    <td className="px-5 py-4 text-slate-600">
                      {app.submittedAt ? (
                        <>
                          <div>{new Date(app.submittedAt).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(app.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">Not submitted</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold text-[11px] ${
                        app.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : app.status === 'under_review'
                          ? 'bg-blue-100 text-blue-800'
                          : app.status === 'submitted'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {app.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        {app.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {app.status === 'under_review' && <FileText className="w-3 h-3" />}
                        {app.status === 'submitted' && <Clock className="w-3 h-3" />}
                        {app.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => onSelectApplication(app.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">No applications found matching criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Try switching filters or search terms.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
