import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  agentVerificationTokens,
  insuranceAgents,
  subcontractors,
  generalContractors,
} from '../data/mockData';

export default function AgentPortal() {
  const { token } = useParams();
  const [submitted, setSubmitted] = useState(false);
  const [action, setAction] = useState(null); // 'confirm' | 'upload' | 'not_agent'
  const [file, setFile] = useState(null);

  // Look up token
  const verification = agentVerificationTokens.find((t) => t.token === token);

  if (!verification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Invalid or Expired Link</h1>
          <p className="text-sm text-gray-500 mt-2">
            This verification link is no longer valid. Please contact the requesting party for a new link.
          </p>
        </div>
      </div>
    );
  }

  const agent = insuranceAgents.find((a) => a.id === verification.agent_id);
  const sub = subcontractors.find((s) => s.id === verification.sub_id);
  const gc = generalContractors.find((g) => g.id === verification.gc_id);
  const coverageLabel = verification.coverage_type === 'gl' ? 'General Liability' : "Workers' Compensation";

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Thank You!</h1>
          <p className="text-sm text-gray-500 mt-2">
            {action === 'confirm'
              ? `You've confirmed that the ${coverageLabel} policy for ${sub?.company_name} is still active.`
              : action === 'upload'
              ? `Certificate uploaded successfully for ${sub?.company_name}. The compliance team will review it shortly.`
              : `You've indicated you are no longer the agent for ${sub?.company_name}. The compliance team has been notified.`}
          </p>
          <p className="text-xs text-gray-400 mt-4">You can close this window now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">ComplySub Verification</h1>
          <p className="text-sm text-gray-500 mt-1">Insurance Certificate Verification Request</p>
        </div>

        {/* Request details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Subcontractor</p>
                <p className="text-lg font-semibold text-gray-900">{sub?.company_name}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${verification.coverage_type === 'gl' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                {coverageLabel}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Requested By</p>
                <p className="text-sm font-medium text-gray-900">{gc?.company_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Agent</p>
                <p className="text-sm font-medium text-gray-900">{agent?.full_name}</p>
                <p className="text-xs text-gray-500">{agent?.agency_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Choose an action:</h2>

          {/* Confirm active */}
          <button
            onClick={() => { setAction('confirm'); setSubmitted(true); }}
            className="w-full bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-success-300 hover:bg-success-50/30 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-success-100">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Policy Still Active</p>
                <p className="text-sm text-gray-500 mt-0.5">Confirm that the {coverageLabel.toLowerCase()} policy is current and in force</p>
              </div>
            </div>
          </button>

          {/* Upload cert */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-primary-300 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Upload New Certificate</p>
                <p className="text-sm text-gray-500 mt-0.5">Upload an updated certificate of insurance (PDF)</p>
              </div>
            </div>
            <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${file ? 'border-success-300 bg-success-50' : 'border-gray-200'}`}>
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{file.name}</span>
                  <button onClick={() => setFile(null)} className="text-xs text-danger-600 hover:underline">Remove</button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <span className="text-sm text-primary-600 font-medium hover:underline">Choose file</span>
                  <input type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              )}
            </div>
            {file && (
              <button
                onClick={() => { setAction('upload'); setSubmitted(true); }}
                className="w-full mt-3 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Submit Certificate
              </button>
            )}
          </div>

          {/* No longer agent */}
          <button
            onClick={() => { setAction('not_agent'); setSubmitted(true); }}
            className="w-full bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-gray-300 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">I Am No Longer This Sub's Agent</p>
                <p className="text-sm text-gray-500 mt-0.5">Notify the compliance team that you no longer represent this subcontractor</p>
              </div>
            </div>
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Powered by ComplySub &mdash; Subcontractor Insurance Compliance
        </p>
      </div>
    </div>
  );
}
