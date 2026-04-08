export default function ComplianceBar({ compliant, expiring, nonCompliant, total }) {
  if (total === 0) return <div className="h-2 bg-gray-200 rounded-full" />;

  const pctCompliant = (compliant / total) * 100;
  const pctExpiring = (expiring / total) * 100;
  const pctNonCompliant = (nonCompliant / total) * 100;

  return (
    <div className="w-full">
      <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-200">
        {pctCompliant > 0 && (
          <div className="bg-success-500 transition-all duration-500" style={{ width: `${pctCompliant}%` }} />
        )}
        {pctExpiring > 0 && (
          <div className="bg-warning-500 transition-all duration-500" style={{ width: `${pctExpiring}%` }} />
        )}
        {pctNonCompliant > 0 && (
          <div className="bg-danger-500 transition-all duration-500" style={{ width: `${pctNonCompliant}%` }} />
        )}
      </div>
    </div>
  );
}
