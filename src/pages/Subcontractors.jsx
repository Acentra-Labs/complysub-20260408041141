import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { evaluateSubCompliance, getAgentForSub, getGCsForSub } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';

export default function Subcontractors() {
  const { isConsultant, user } = useAuth();
  const { subcontractors, generalContractors, gcSubLinks } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // For GC users, only show their subs
  let subs = subcontractors;
  if (!isConsultant && user?.gc_id) {
    const subIds = gcSubLinks.filter((l) => l.gc_id === user.gc_id).map((l) => l.sub_id);
    subs = subcontractors.filter((s) => subIds.includes(s.id));
  }

  const subsWithData = subs.map((sub) => ({
    ...sub,
    compliance: evaluateSubCompliance(sub.id),
    agent: getAgentForSub(sub.id),
    gcCount: getGCsForSub(sub.id).length,
  }));

  let filtered = subsWithData;
  if (filter !== 'all') {
    filtered = filtered.filter((s) => s.compliance.overall === filter);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.company_name.toLowerCase().includes(q) ||
        s.contact_name.toLowerCase().includes(q) ||
        s.ein?.includes(q)
    );
  }

  // Sort: worst status first
  const statusOrder = { non_compliant: 0, expiring: 1, compliant: 2 };
  filtered.sort((a, b) => (statusOrder[a.compliance.overall] ?? 3) - (statusOrder[b.compliance.overall] ?? 3));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Subcontractors</h1>
          <p className="text-sm text-gray-500 mt-1">{subs.length} subcontractors in system</p>
        </div>
        <Link
          to="/subcontractors/add"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Subcontractor
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, contact, or EIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Status ({subsWithData.length})</option>
          <option value="compliant">Compliant ({subsWithData.filter((s) => s.compliance.overall === 'compliant').length})</option>
          <option value="expiring">Expiring ({subsWithData.filter((s) => s.compliance.overall === 'expiring').length})</option>
          <option value="non_compliant">Non-Compliant ({subsWithData.filter((s) => s.compliance.overall === 'non_compliant').length})</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-5 font-medium text-gray-500">Company</th>
                <th className="text-left py-3 px-5 font-medium text-gray-500 hidden md:table-cell">Contact</th>
                <th className="text-left py-3 px-5 font-medium text-gray-500 hidden lg:table-cell">Agent</th>
                <th className="text-center py-3 px-5 font-medium text-gray-500">GL</th>
                <th className="text-center py-3 px-5 font-medium text-gray-500">WC</th>
                <th className="text-center py-3 px-5 font-medium text-gray-500">Overall</th>
                {isConsultant && <th className="text-center py-3 px-5 font-medium text-gray-500 hidden xl:table-cell">GCs</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-5">
                    <Link to={`/sub/${sub.id}`} className="hover:text-primary-600">
                      <p className="font-medium text-gray-900">{sub.company_name}</p>
                      <p className="text-xs text-gray-400">{sub.entity_type}{sub.is_sole_proprietor ? ' (Sole Prop)' : ''}</p>
                    </Link>
                  </td>
                  <td className="py-3 px-5 hidden md:table-cell">
                    <p className="text-gray-700">{sub.contact_name}</p>
                    <p className="text-xs text-gray-400">{sub.email}</p>
                  </td>
                  <td className="py-3 px-5 hidden lg:table-cell">
                    {sub.agent ? (
                      <p className="text-gray-700">{sub.agent.full_name}</p>
                    ) : (
                      <span className="text-gray-300">No agent</span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-center">
                    <StatusBadge status={sub.compliance.gl} />
                  </td>
                  <td className="py-3 px-5 text-center">
                    <StatusBadge status={sub.compliance.wc} />
                  </td>
                  <td className="py-3 px-5 text-center">
                    <StatusBadge status={sub.compliance.overall} size="lg" />
                  </td>
                  {isConsultant && (
                    <td className="py-3 px-5 text-center hidden xl:table-cell">
                      <span className="text-gray-500">{sub.gcCount}</span>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isConsultant ? 7 : 6} className="py-12 text-center text-gray-400">
                    No subcontractors match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
