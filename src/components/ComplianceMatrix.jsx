import { evaluateSubCompliance } from '../utils/helpers';

const dotColors = {
  current: 'bg-success-500',
  compliant: 'bg-success-500',
  expiring: 'bg-warning-500',
  expired: 'bg-danger-500',
  non_compliant: 'bg-danger-500',
  missing: 'bg-gray-300',
  ghost: 'bg-purple-500',
  exempt: 'bg-blue-400',
};

const dotLabels = {
  current: 'Current',
  compliant: 'Compliant',
  expiring: 'Expiring',
  expired: 'Expired',
  non_compliant: 'Non-Compliant',
  missing: 'Missing',
  ghost: 'Ghost Policy',
  exempt: 'Exempt',
};

export default function ComplianceMatrix({ subs }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 pr-4 font-medium text-gray-500 w-48">Subcontractor</th>
            <th className="text-center py-2 px-4 font-medium text-gray-500 w-20">GL</th>
            <th className="text-center py-2 px-4 font-medium text-gray-500 w-20">WC</th>
            <th className="text-center py-2 px-4 font-medium text-gray-500 w-20">W-9</th>
          </tr>
        </thead>
        <tbody>
          {subs.map((sub) => {
            const compliance = evaluateSubCompliance(sub.id);
            return (
              <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2.5 pr-4 font-medium text-gray-900 truncate max-w-[12rem]">
                  {sub.company_name}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <div className="flex justify-center" title={`GL: ${dotLabels[compliance.gl]}`}>
                    <div className={`w-3.5 h-3.5 rounded-full ${dotColors[compliance.gl] || 'bg-gray-300'}`} />
                  </div>
                </td>
                <td className="py-2.5 px-4 text-center">
                  <div className="flex justify-center" title={`WC: ${dotLabels[compliance.wc]}`}>
                    <div className={`w-3.5 h-3.5 rounded-full ${dotColors[compliance.wc] || 'bg-gray-300'}`} />
                  </div>
                </td>
                <td className="py-2.5 px-4 text-center">
                  <div className="flex justify-center" title={`W-9: ${dotLabels[compliance.w9]}`}>
                    <div className={`w-3.5 h-3.5 rounded-full ${dotColors[compliance.w9] || 'bg-gray-300'}`} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100">
        {[
          { color: 'bg-success-500', label: 'Current' },
          { color: 'bg-warning-500', label: 'Expiring' },
          { color: 'bg-danger-500', label: 'Expired / Non-Compliant' },
          { color: 'bg-gray-300', label: 'Missing' },
          { color: 'bg-purple-500', label: 'Ghost Policy' },
          { color: 'bg-blue-400', label: 'Exempt' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
