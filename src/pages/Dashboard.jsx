import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { getGCComplianceSummary, getGCSubIds, evaluateSubCompliance, getSubsForGC } from '../utils/helpers';
import ComplianceBar from '../components/ComplianceBar';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const { user, isConsultant } = useAuth();

  if (isConsultant) return <ConsultantDashboard />;
  return <GCDashboard gcId={user?.gc_id} />;
}

function ConsultantDashboard() {
  const { generalContractors, notifications } = useData();

  const recentNotifs = notifications
    .filter((n) => !n.read)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // Overall metrics
  let totalSubs = 0;
  let totalCompliant = 0;
  let totalExpiring = 0;
  let totalNonCompliant = 0;

  const gcData = generalContractors.map((gc) => {
    const summary = getGCComplianceSummary(gc.id);
    totalSubs += summary.total;
    totalCompliant += summary.compliant;
    totalExpiring += summary.expiring;
    totalNonCompliant += summary.nonCompliant;
    return { ...gc, summary };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">All GC clients at a glance</p>
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Subcontractors" value={totalSubs} color="text-gray-900" />
        <MetricCard label="Compliant" value={totalCompliant} color="text-success-600" />
        <MetricCard label="Expiring Soon" value={totalExpiring} color="text-warning-600" />
        <MetricCard label="Non-Compliant" value={totalNonCompliant} color="text-danger-600" />
      </div>

      {/* GC cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">General Contractors</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {gcData.map(({ summary, ...gc }) => (
            <Link
              key={gc.id}
              to={`/gc/${gc.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-primary-200 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                    {gc.company_name}
                  </h3>
                  <p className="text-sm text-gray-500">{gc.contact_name}</p>
                </div>
                <span
                  className={`text-2xl font-bold ${
                    summary.compliancePercent >= 90
                      ? 'text-success-600'
                      : summary.compliancePercent >= 70
                      ? 'text-warning-600'
                      : 'text-danger-600'
                  }`}
                >
                  {summary.compliancePercent}%
                </span>
              </div>

              <ComplianceBar
                compliant={summary.compliant}
                expiring={summary.expiring}
                nonCompliant={summary.nonCompliant}
                total={summary.total}
              />

              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-success-500 rounded-full" />
                  {summary.compliant} compliant
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-warning-500 rounded-full" />
                  {summary.expiring} expiring
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-danger-500 rounded-full" />
                  {summary.nonCompliant} issues
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">{summary.total} subcontractors</span>
                <span className="text-xs text-primary-600 font-medium group-hover:underline">View details &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent alerts */}
      {recentNotifs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {recentNotifs.map((n) => (
              <div key={n.id} className="px-5 py-3 flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    n.type.includes('expired') || n.type.includes('compliance')
                      ? 'bg-danger-500'
                      : n.type.includes('expiring')
                      ? 'bg-warning-500'
                      : 'bg-primary-500'
                  }`}
                />
                <p className="text-sm text-gray-700 flex-1">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GCDashboard({ gcId }) {
  const { generalContractors } = useData();
  const gc = generalContractors.find((g) => g.id === gcId);
  const subs = getSubsForGC(gcId);

  if (!gc) {
    return <p className="text-gray-500">No GC account linked.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{gc.company_name}</h1>
        <p className="text-sm text-gray-500">Subcontractor compliance overview</p>
      </div>

      <div className="grid gap-4">
        {subs.map((sub) => {
          const compliance = evaluateSubCompliance(sub.id);
          return (
            <Link
              key={sub.id}
              to={`/sub/${sub.id}`}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900">{sub.company_name}</h3>
                <p className="text-sm text-gray-500">{sub.contact_name}</p>
                {compliance.issues.length > 0 && (
                  <p className="text-xs text-danger-600 mt-1">{compliance.issues[0]}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={compliance.gl} label={`GL: ${compliance.gl}`} />
                <StatusBadge status={compliance.wc} label={`WC: ${compliance.wc}`} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
