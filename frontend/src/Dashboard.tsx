import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from './api';
import './Dashboard.css';

export const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, needsMaintenance: 0, expired: 0, scheduledInspections: 0, completedInspections: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('/extinguishers/api/extinguishers').catch(() => ({ extinguishers: [] })),
      api('/inspections/api/inspections').catch(() => ({ inspections: [] })),
    ]).then(([extData, inspData]) => {
      const exts = extData.extinguishers || extData.data || [];
      const insps = inspData.inspections || inspData.data || [];
      setStats({
        total: exts.length,
        active: exts.filter((e: any) => e.status === 'Active').length,
        needsMaintenance: exts.filter((e: any) => e.status === 'Needs Maintenance').length,
        expired: exts.filter((e: any) => e.status === 'Expired').length,
        scheduledInspections: insps.filter((i: any) => i.status === 'Scheduled').length,
        completedInspections: insps.filter((i: any) => i.status === 'Completed').length,
      });
      setLoading(false);
    });
  }, []);

  const cards = [
    { label: 'Total Extinguishers', value: stats.total, icon: Flame, color: 'text-blue-600 bg-blue-50', link: '/extinguishers' },
    { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-green-600 bg-green-50', link: '/extinguishers' },
    { label: 'Needs Maintenance', value: stats.needsMaintenance, icon: AlertCircle, color: 'text-yellow-600 bg-yellow-50', link: '/extinguishers' },
    { label: 'Scheduled Inspections', value: stats.scheduledInspections, icon: Calendar, color: 'text-purple-600 bg-purple-50', link: '/inspections' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Fire Extinguisher Management System overview</p>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map(({ label, value, icon: Icon, color, link }) => (
            <Link key={label} to={link} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`inline-flex p-2 rounded-lg ${color} mb-3`}><Icon size={20} /></div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link to="/extinguishers" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-sm text-gray-700"><Flame size={16} className="text-blue-600" /> Manage Extinguishers</Link>
            <Link to="/inspections" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-sm text-gray-700"><Calendar size={16} className="text-purple-600" /> Schedule Inspection</Link>
            <Link to="/reports" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-sm text-gray-700"><CheckCircle size={16} className="text-green-600" /> View Reports</Link>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Status Summary</h2>
          {[
            { label: 'Active', value: stats.active, color: 'bg-green-500' },
            { label: 'Needs Maintenance', value: stats.needsMaintenance, color: 'bg-yellow-500' },
            { label: 'Expired', value: stats.expired, color: 'bg-red-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{label}</span><span className="font-medium">{value}</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: stats.total ? `${(value / stats.total) * 100}%` : '0%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
