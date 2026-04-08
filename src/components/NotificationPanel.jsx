import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { formatDate } from '../utils/helpers';

const typeIcons = {
  cert_uploaded: '\u2B06',
  cert_expiring: '\u23F0',
  cert_expired: '\u274C',
  sub_added: '\u2795',
  compliance_issue: '\u26A0',
  verification_sent: '\u2709',
  agent_response: '\u2705',
};

const typeBg = {
  cert_uploaded: 'bg-success-50 border-success-200',
  cert_expiring: 'bg-warning-50 border-warning-200',
  cert_expired: 'bg-danger-50 border-danger-200',
  sub_added: 'bg-primary-50 border-primary-200',
  compliance_issue: 'bg-warning-50 border-warning-200',
  verification_sent: 'bg-primary-50 border-primary-200',
  agent_response: 'bg-success-50 border-success-200',
};

export default function NotificationPanel({ isOpen, onClose }) {
  const { user } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();

  const userNotifs = notifications
    .filter((n) => n.user_id === user?.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const unreadCount = userNotifs.filter((n) => !n.read).length;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {userNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {userNotifs.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    n.read ? 'bg-white' : 'bg-primary-50/30'
                  } hover:bg-gray-50`}
                  onClick={() => !n.read && markNotificationRead(n.id)}
                >
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm border ${typeBg[n.type] || 'bg-gray-50 border-gray-200'}`}>
                      {typeIcons[n.type] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {n.title}
                        </p>
                        {!n.read && <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
