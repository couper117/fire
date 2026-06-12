import { useState, useEffect } from 'react';
import { api } from '../api';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { Button } from '../components/shared/Button';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

export const Reports = () => {
  const [daily, setDaily] = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('/reports/api/reports/daily').catch(() => null),
      api('/reports/api/reports/monthly').catch(() => null),
    ]).then(([d, m]) => {
      setDaily(d);
      setMonthly(m);
      setLoading(false);
    });
  }, []);

  const exportCSV = (data: any, filename: string) => {
    if (!data) { toast.error('No data to export'); return; }
    const rows = Object.entries(data).map(([k, v]) => `"${k}","${v}"`);
    const csv = ['Key,Value', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    toast.success('Report exported');
  };

  if (loading) return <LoadingSpinner label="Loading reports..." />;

  const StatRow = ({ label, value }: { label: string; value: any }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{String(value ?? '—')}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Daily Report</h2>
            <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => exportCSV(daily, `daily-report-${Date.now()}.csv`)}>Export</Button>
          </div>
          {daily ? (
            <div>
              {Object.entries(daily).filter(([k]) => k !== '__v' && k !== '_id').map(([k, v]) => (
                <StatRow key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={v as any} />
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No daily data available.</p>}
        </div>

        {/* Monthly */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Monthly Report</h2>
            <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => exportCSV(monthly, `monthly-report-${Date.now()}.csv`)}>Export</Button>
          </div>
          {monthly ? (
            <div>
              {Object.entries(monthly).filter(([k]) => k !== '__v' && k !== '_id').map(([k, v]) => (
                <StatRow key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={v as any} />
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No monthly data available.</p>}
        </div>
      </div>
    </div>
  );
};
