import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { getSubById, formatDate } from '../utils/helpers';

const statusColors = {
  sent: 'bg-blue-50 text-blue-700',
  delivered: 'bg-success-50 text-success-700',
  opened: 'bg-success-50 text-success-700',
  bounced: 'bg-danger-50 text-danger-700',
  failed: 'bg-danger-50 text-danger-700',
};

const templateLabels = {
  cert_request: 'Certificate Request',
  verification_request: 'Verification',
  expiration_warning: 'Expiration Warning',
  lapse_notification: 'Lapse Notification',
  w9_renewal: 'W-9 Renewal',
};

export default function EmailLog() {
  const { emailLogs } = useData();
  const [filter, setFilter] = useState('all');

  let logs = [...emailLogs].sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
  if (filter !== 'all') {
    logs = logs.filter((l) => l.template_type === filter);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Log</h1>
        <p className="text-sm text-gray-500 mt-1">Track all outbound communications</p>
      </div>

      <div className="flex gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Types</option>
          <option value="cert_request">Certificate Requests</option>
          <option value="verification_request">Verifications</option>
          <option value="expiration_warning">Expiration Warnings</option>
          <option value="lapse_notification">Lapse Notifications</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-5 font-medium text-gray-500">Recipient</th>
                <th className="text-left py-3 px-5 font-medium text-gray-500">Subject</th>
                <th className="text-left py-3 px-5 font-medium text-gray-500 hidden md:table-cell">Type</th>
                <th className="text-left py-3 px-5 font-medium text-gray-500 hidden lg:table-cell">Sub</th>
                <th className="text-center py-3 px-5 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-5 font-medium text-gray-500 hidden md:table-cell">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => {
                const sub = getSubById(log.sub_id);
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-3 px-5">
                      <p className="font-medium text-gray-900">{log.to_name}</p>
                      <p className="text-xs text-gray-400">{log.to_email}</p>
                    </td>
                    <td className="py-3 px-5 max-w-[240px]">
                      <p className="text-gray-700 truncate">{log.subject}</p>
                    </td>
                    <td className="py-3 px-5 hidden md:table-cell">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                        {templateLabels[log.template_type] || log.template_type}
                      </span>
                    </td>
                    <td className="py-3 px-5 hidden lg:table-cell text-gray-500">
                      {sub?.company_name || '—'}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[log.status] || 'bg-gray-100 text-gray-600'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 hidden md:table-cell text-gray-500 text-xs">
                      {formatDate(log.sent_at)}
                      {log.opened_at && (
                        <p className="text-success-600 mt-0.5">Opened {formatDate(log.opened_at)}</p>
                      )}
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No emails logged yet.
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
