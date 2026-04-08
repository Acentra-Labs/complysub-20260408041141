import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { getSubById, getCertStatus, daysUntil, formatDate, formatCurrency } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';

export default function Certificates() {
  const { user, isConsultant } = useAuth();
  const { certificates, gcSubLinks } = useData();
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  // For GC users, only show certs for their subs
  let certs = certificates;
  if (!isConsultant && user?.gc_id) {
    const subIds = gcSubLinks.filter((l) => l.gc_id === user.gc_id).map((l) => l.sub_id);
    certs = certificates.filter((c) => subIds.includes(c.sub_id));
  }

  const certsWithData = certs.map((cert) => {
    const sub = getSubById(cert.sub_id);
    const status = getCertStatus(cert);
    const days = daysUntil(cert.expiration_date);
    return { ...cert, sub, status, daysLeft: days };
  });

  let filtered = certsWithData;
  if (filter !== 'all') filtered = filtered.filter((c) => c.status === filter);
  if (typeFilter !== 'all') filtered = filtered.filter((c) => c.coverage_type === typeFilter);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.sub?.company_name.toLowerCase().includes(q) ||
        c.policy_number.toLowerCase().includes(q) ||
        c.carrier.toLowerCase().includes(q)
    );
  }

  // Sort: expired first, then expiring, then current
  const statusOrder = { expired: 0, expiring: 1, current: 2 };
  filtered.sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3));

  const counts = {
    all: certsWithData.length,
    current: certsWithData.filter((c) => c.status === 'current').length,
    expiring: certsWithData.filter((c) => c.status === 'expiring').length,
    expired: certsWithData.filter((c) => c.status === 'expired').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
          <p className="text-sm text-gray-500 mt-1">{certs.length} certificates on file</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => setFilter('all')} className={`bg-white rounded-xl border p-4 text-left transition-colors ${filter === 'all' ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200 hover:border-gray-300'}`}>
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{counts.all}</p>
        </button>
        <button onClick={() => setFilter('current')} className={`bg-white rounded-xl border p-4 text-left transition-colors ${filter === 'current' ? 'border-success-500 ring-1 ring-success-500' : 'border-gray-200 hover:border-gray-300'}`}>
          <p className="text-sm text-gray-500">Current</p>
          <p className="text-2xl font-bold text-success-600">{counts.current}</p>
        </button>
        <button onClick={() => setFilter('expiring')} className={`bg-white rounded-xl border p-4 text-left transition-colors ${filter === 'expiring' ? 'border-warning-500 ring-1 ring-warning-500' : 'border-gray-200 hover:border-gray-300'}`}>
          <p className="text-sm text-gray-500">Expiring (30d)</p>
          <p className="text-2xl font-bold text-warning-600">{counts.expiring}</p>
        </button>
        <button onClick={() => setFilter('expired')} className={`bg-white rounded-xl border p-4 text-left transition-colors ${filter === 'expired' ? 'border-danger-500 ring-1 ring-danger-500' : 'border-gray-200 hover:border-gray-300'}`}>
          <p className="text-sm text-gray-500">Expired</p>
          <p className="text-2xl font-bold text-danger-600">{counts.expired}</p>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by company, policy #, or carrier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Types</option>
          <option value="gl">General Liability</option>
          <option value="wc">Workers' Comp</option>
        </select>
      </div>

      {/* Certificates list */}
      <div className="space-y-3">
        {filtered.map((cert) => (
          <div key={cert.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/sub/${cert.sub_id}`} className="font-medium text-gray-900 hover:text-primary-600">
                    {cert.sub?.company_name || 'Unknown'}
                  </Link>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${cert.coverage_type === 'gl' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                    {cert.coverage_type === 'gl' ? 'GL' : 'WC'}
                  </span>
                  <StatusBadge status={cert.status} />
                  {cert.is_ghost_policy && <StatusBadge status="ghost" />}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>Policy: {cert.policy_number}</span>
                  <span>{cert.carrier}</span>
                  <span>{formatCurrency(cert.limit_per_occurrence)}/occ</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm text-gray-500">
                  {formatDate(cert.effective_date)} &mdash; {formatDate(cert.expiration_date)}
                </p>
                {cert.status === 'expiring' && (
                  <p className="text-sm font-medium text-warning-600">{cert.daysLeft} days left</p>
                )}
                {cert.status === 'expired' && (
                  <p className="text-sm font-medium text-danger-600">Expired {Math.abs(cert.daysLeft)}d ago</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
            No certificates match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
