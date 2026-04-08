import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../components/Toast';
import {
  getSubById,
  getAgentForSub,
  getCertsForSub,
  evaluateSubCompliance,
  getGCsForSub,
  formatDate,
  formatCurrency,
  getCertStatus,
  daysUntil,
} from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';

export default function SubDetail() {
  const { subId } = useParams();
  const { isConsultant } = useAuth();
  const { generalContractors, logEmail } = useData();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  const sub = getSubById(subId);
  const agent = getAgentForSub(subId);
  const certs = getCertsForSub(subId);
  const compliance = sub ? evaluateSubCompliance(subId) : null;
  const linkedGCIds = sub ? getGCsForSub(subId) : [];
  const linkedGCs = linkedGCIds.map((id) => generalContractors.find((g) => g.id === id)).filter(Boolean);

  if (!sub) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Subcontractor not found.</p>
        <Link to="/dashboard" className="text-primary-600 text-sm hover:underline mt-2 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  const handleSendVerification = () => {
    if (!agent) {
      toast.error('No agent on file for this subcontractor');
      return;
    }
    logEmail({
      tenant_id: 't-001',
      to_email: agent.email,
      to_name: agent.full_name,
      subject: `Verification Request — ${sub.company_name}`,
      template_type: 'verification_request',
      sub_id: sub.id,
    });
    toast.success(`Verification request sent to ${agent.full_name}`);
  };

  const handleRequestCert = (type) => {
    if (!agent) {
      toast.error('No agent on file for this subcontractor');
      return;
    }
    const label = type === 'gl' ? 'General Liability' : 'Workers\' Comp';
    logEmail({
      tenant_id: 't-001',
      to_email: agent.email,
      to_name: agent.full_name,
      subject: `Certificate Request — ${sub.company_name} (${label})`,
      template_type: 'cert_request',
      sub_id: sub.id,
    });
    toast.success(`${label} certificate request sent to ${agent.full_name}`);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'timeline', label: 'Timeline' },
  ];
  if (isConsultant) tabs.push({ id: 'linked-gcs', label: 'Linked GCs' });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link to="/dashboard" className="hover:text-primary-600">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link to="/subcontractors" className="hover:text-primary-600">Subcontractors</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{sub.company_name}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{sub.company_name}</h1>
              <StatusBadge status={compliance.overall} size="lg" />
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span>{sub.contact_name}</span>
              <span>{sub.phone}</span>
              <span>{sub.email}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{sub.entity_type}</span>
              {sub.ein && <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">EIN: {sub.ein}</span>}
              {sub.is_sole_proprietor && <span className="text-xs bg-purple-50 px-2 py-1 rounded text-purple-700">Sole Proprietor</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleSendVerification}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Send Verification
            </button>
            <Link
              to={`/sub/${sub.id}/upload-cert`}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Upload Certificate
            </Link>
          </div>
        </div>

        {/* Compliance issues */}
        {compliance.issues.length > 0 && (
          <div className="mt-4 bg-danger-50 border border-danger-200 rounded-lg p-3">
            <p className="text-sm font-medium text-danger-700 mb-1">Compliance Issues</p>
            <ul className="space-y-0.5">
              {compliance.issues.map((issue, i) => (
                <li key={i} className="text-sm text-danger-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-danger-400 rounded-full flex-shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Company info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Company Information</h3>
            <dl className="space-y-3">
              <InfoRow label="Company Name" value={sub.company_name} />
              <InfoRow label="Contact" value={sub.contact_name} />
              <InfoRow label="Email" value={sub.email} />
              <InfoRow label="Phone" value={sub.phone} />
              <InfoRow label="Address" value={sub.address} />
              <InfoRow label="EIN" value={sub.ein || '—'} />
              <InfoRow label="Entity Type" value={sub.entity_type} />
            </dl>
          </div>

          {/* Agent info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Insurance Agent</h3>
            {agent ? (
              <dl className="space-y-3">
                <InfoRow label="Agent Name" value={agent.full_name} />
                <InfoRow label="Agency" value={agent.agency_name} />
                <InfoRow label="Email" value={agent.email} />
                <InfoRow label="Phone" value={agent.phone} />
              </dl>
            ) : (
              <p className="text-sm text-gray-400">No agent on file</p>
            )}
          </div>

          {/* W-9 Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">W-9 Status</h3>
            <div className="flex items-center gap-3 mb-3">
              <StatusBadge status={compliance.w9} size="lg" />
            </div>
            <dl className="space-y-3">
              <InfoRow label="On File" value={sub.w9_on_file ? 'Yes' : 'No'} />
              <InfoRow label="Uploaded" value={formatDate(sub.w9_uploaded_at)} />
              <InfoRow label="Expires" value={formatDate(sub.w9_expires_at)} />
            </dl>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleRequestCert('gl')}
                className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                <span className="font-medium text-gray-900">Request GL Certificate</span>
                <p className="text-xs text-gray-500 mt-0.5">Send email to agent requesting General Liability cert</p>
              </button>
              <button
                onClick={() => handleRequestCert('wc')}
                className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                <span className="font-medium text-gray-900">Request WC Certificate</span>
                <p className="text-xs text-gray-500 mt-0.5">Send email to agent requesting Workers' Comp cert</p>
              </button>
              <button
                onClick={handleSendVerification}
                className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                <span className="font-medium text-gray-900">Re-verify Policies</span>
                <p className="text-xs text-gray-500 mt-0.5">Send verification email to confirm policies are still active</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'certificates' && (
        <div className="space-y-4">
          {certs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-400">No certificates on file</p>
              <Link
                to={`/sub/${sub.id}/upload-cert`}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Upload Certificate
              </Link>
            </div>
          ) : (
            certs.map((cert) => {
              const status = getCertStatus(cert);
              const days = daysUntil(cert.expiration_date);
              return (
                <div key={cert.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">
                          {cert.coverage_type === 'gl' ? 'General Liability' : "Workers' Compensation"}
                        </h4>
                        <StatusBadge status={status} />
                        {cert.is_ghost_policy && <StatusBadge status="ghost" />}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">Policy: {cert.policy_number}</p>
                    </div>
                    {status === 'expiring' && (
                      <span className="text-sm font-medium text-warning-600 bg-warning-50 px-3 py-1 rounded-full">
                        {days} days left
                      </span>
                    )}
                    {status === 'expired' && (
                      <span className="text-sm font-medium text-danger-600 bg-danger-50 px-3 py-1 rounded-full">
                        Expired {Math.abs(days)}d ago
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Carrier</p>
                      <p className="font-medium text-gray-900">{cert.carrier}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Per Occurrence</p>
                      <p className="font-medium text-gray-900">{formatCurrency(cert.limit_per_occurrence)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Effective</p>
                      <p className="font-medium text-gray-900">{formatDate(cert.effective_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Expires</p>
                      <p className="font-medium text-gray-900">{formatDate(cert.expiration_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                    <span>Additional Insured: {cert.additional_insured ? 'Yes' : 'No'}</span>
                    <span>Uploaded: {formatDate(cert.uploaded_at)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Compliance Timeline</h3>
          <div className="space-y-4">
            {certs
              .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
              .map((cert) => (
                <div key={cert.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-primary-500 rounded-full mt-1" />
                    <div className="w-px h-full bg-gray-200" />
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-900">
                      {cert.coverage_type === 'gl' ? 'GL' : 'WC'} certificate uploaded
                    </p>
                    <p className="text-xs text-gray-500">
                      {cert.carrier} &mdash; Policy {cert.policy_number}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(cert.uploaded_at)}</p>
                  </div>
                </div>
              ))}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-gray-300 rounded-full mt-1" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Subcontractor created</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(sub.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'linked-gcs' && isConsultant && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Linked General Contractors</h3>
          {linkedGCs.length === 0 ? (
            <p className="text-sm text-gray-400">Not linked to any GC</p>
          ) : (
            <div className="space-y-3">
              {linkedGCs.map((gc) => (
                <Link
                  key={gc.id}
                  to={`/gc/${gc.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{gc.company_name}</p>
                    <p className="text-sm text-gray-500">{gc.contact_name}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</dd>
    </div>
  );
}
