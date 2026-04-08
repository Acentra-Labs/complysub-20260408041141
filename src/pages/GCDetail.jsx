import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { getSubsForGC, getGCComplianceSummary, evaluateSubCompliance, getLatestCert, getCertStatusLabel, formatDate, formatCurrency, getAgentForSub } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';
import ComplianceBar from '../components/ComplianceBar';
import ComplianceMatrix from '../components/ComplianceMatrix';

export default function GCDetail() {
  const { gcId } = useParams();
  const { generalContractors } = useData();
  const [view, setView] = useState('table'); // 'table' | 'matrix'
  const [filter, setFilter] = useState('all'); // 'all' | 'compliant' | 'expiring' | 'non_compliant'
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('status'); // 'status' | 'name' | 'gl' | 'wc'

  const gc = generalContractors.find((g) => g.id === gcId);
  const subs = getSubsForGC(gcId);
  const summary = getGCComplianceSummary(gcId);

  if (!gc) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">General Contractor not found.</p>
        <Link to="/dashboard" className="text-primary-600 text-sm hover:underline mt-2 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  // Filter and sort
  const subsWithCompliance = subs.map((sub) => ({
    ...sub,
    compliance: evaluateSubCompliance(sub.id),
    agent: getAgentForSub(sub.id),
    glCert: getLatestCert(sub.id, 'gl'),
    wcCert: getLatestCert(sub.id, 'wc'),
  }));

  let filtered = subsWithCompliance;
  if (filter !== 'all') {
    filtered = filtered.filter((s) => s.compliance.overall === filter);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.company_name.toLowerCase().includes(q) ||
        s.contact_name.toLowerCase().includes(q)
    );
  }

  // Sort
  const statusOrder = { non_compliant: 0, expiring: 1, compliant: 2 };
  filtered.sort((a, b) => {
    if (sort === 'status') return (statusOrder[a.compliance.overall] ?? 3) - (statusOrder[b.compliance.overall] ?? 3);
    if (sort === 'name') return a.company_name.localeCompare(b.company_name);
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link to="/dashboard" className="hover:text-primary-600">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{gc.company_name}</span>
      </nav>

      {/* GC Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{gc.company_name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
              <span>{gc.contact_name}</span>
              <span>{gc.phone}</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">License: {gc.license_number}</span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${summary.compliancePercent >= 90 ? 'text-success-600' : summary.compliancePercent >= 70 ? 'text-warning-600' : 'text-danger-600'}`}>
              {summary.compliancePercent}%
            </div>
            <p className="text-xs text-gray-500 mt-1">compliance rate</p>
          </div>
        </div>
        <div className="mt-4">
          <ComplianceBar compliant={summary.compliant} expiring={summary.expiring} nonCompliant={summary.nonCompliant} total={summary.total} />
        </div>
        <div className="flex gap-6 mt-3 text-sm">
          <span className="text-success-600 font-medium">{summary.compliant} compliant</span>
          <span className="text-warning-600 font-medium">{summary.expiring} expiring</span>
          <span className="text-danger-600 font-medium">{summary.nonCompliant} non-compliant</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search subs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="compliant">Compliant</option>
            <option value="expiring">Expiring</option>
            <option value="non_compliant">Non-Compliant</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="status">Sort: Status</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView('table')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'table' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Table
          </button>
          <button
            onClick={() => setView('matrix')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'matrix' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Matrix
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200">
        {view === 'matrix' ? (
          <div className="p-5">
            <ComplianceMatrix subs={filtered} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-5 font-medium text-gray-500">Subcontractor</th>
                  <th className="text-left py-3 px-5 font-medium text-gray-500 hidden md:table-cell">Agent</th>
                  <th className="text-center py-3 px-5 font-medium text-gray-500">GL Status</th>
                  <th className="text-center py-3 px-5 font-medium text-gray-500">WC Status</th>
                  <th className="text-center py-3 px-5 font-medium text-gray-500 hidden lg:table-cell">W-9</th>
                  <th className="text-center py-3 px-5 font-medium text-gray-500">Overall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-5">
                      <Link to={`/sub/${sub.id}`} className="hover:text-primary-600">
                        <p className="font-medium text-gray-900">{sub.company_name}</p>
                        <p className="text-xs text-gray-500">{sub.contact_name}</p>
                      </Link>
                    </td>
                    <td className="py-3 px-5 hidden md:table-cell">
                      {sub.agent ? (
                        <div>
                          <p className="text-gray-700">{sub.agent.full_name}</p>
                          <p className="text-xs text-gray-400">{sub.agent.agency_name}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <StatusBadge status={sub.compliance.gl} label={getCertStatusLabel(sub.glCert)} />
                    </td>
                    <td className="py-3 px-5 text-center">
                      <StatusBadge status={sub.compliance.wc} />
                    </td>
                    <td className="py-3 px-5 text-center hidden lg:table-cell">
                      <StatusBadge status={sub.compliance.w9} />
                    </td>
                    <td className="py-3 px-5 text-center">
                      <StatusBadge status={sub.compliance.overall} size="lg" />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No subcontractors match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
