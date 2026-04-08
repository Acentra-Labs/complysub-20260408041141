const statusConfig = {
  current: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success-500', label: 'Current' },
  compliant: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success-500', label: 'Compliant' },
  expiring: { bg: 'bg-warning-50', text: 'text-warning-600', dot: 'bg-warning-500', label: 'Expiring' },
  expired: { bg: 'bg-danger-50', text: 'text-danger-700', dot: 'bg-danger-500', label: 'Expired' },
  non_compliant: { bg: 'bg-danger-50', text: 'text-danger-700', dot: 'bg-danger-500', label: 'Non-Compliant' },
  missing: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Missing' },
  ghost: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Ghost Policy' },
  exempt: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Exempt' },
};

export default function StatusBadge({ status, label, size = 'sm' }) {
  const config = statusConfig[status] || statusConfig.missing;
  const displayLabel = label || config.label;

  const sizeClasses = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {displayLabel}
    </span>
  );
}
