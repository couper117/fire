import { useState, useEffect } from 'react';
import { Users, Flame, AlertCircle, TrendingUp } from 'lucide-react';
import { api } from '../api';
import { LoadingSpinner } from '../components/shared';
import { UserManagement } from '../components/admin/UserManagement';

interface Stats {
  totalUsers: number;
  totalExtinguishers: number;
  pendingInspections: number;
  needsMaintenance: number;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings'>('overview');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [extData, inspData] = await Promise.all([
          api('/extinguishers/api/extinguishers'),
          api('/inspections/api/inspections?upcoming=true'),
        ]);

        setStats({
          totalUsers: 0, // Would be fetched from /users/api/users
          totalExtinguishers: extData.count || 0,
          pendingInspections: inspData.count || 0,
          needsMaintenance: (extData.data || []).filter((e: any) => e.status === 'Needs Maintenance').length,
        });
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
  }: {
    icon: any;
    label: string;
    value: number;
    color: string;
  }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-4 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage system, users, and view analytics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {(['overview', 'users', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              icon={Users}
              label="Total Extinguishers"
              value={stats?.totalExtinguishers || 0}
              color="bg-blue-600"
            />
            <StatCard
              icon={AlertCircle}
              label="Pending Inspections"
              value={stats?.pendingInspections || 0}
              color="bg-warning-600"
            />
            <StatCard
              icon={Flame}
              label="Needs Maintenance"
              value={stats?.needsMaintenance || 0}
              color="bg-danger-600"
            />
            <StatCard
              icon={TrendingUp}
              label="System Health"
              value={94}
              color="bg-success-600"
            />
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="card-title mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">Inspection scheduled</p>
                    <p className="text-sm text-gray-500">Building A - Floor 2</p>
                  </div>
                  <time className="text-sm text-gray-500">2 hours ago</time>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && <UserManagement />}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="card">
          <h2 className="card-title mb-4">System Settings</h2>
          <p className="text-gray-600">Coming soon...</p>
        </div>
      )}
    </div>
  );
};
