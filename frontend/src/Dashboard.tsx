import { useEffect, useState } from 'react';
import { api } from './api';
import './Dashboard.css';

interface ServiceStatus {
  service: string;
  status: string;
}

const API_BASE = ((import.meta.env.VITE_API_URL as string) || '').replace(/\/$/, '');

export const Dashboard = () => {
  const [servicesStatus, setServicesStatus] = useState<ServiceStatus[]>([]);
  const [extinguisherCount, setExtinguisherCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Health checks for each service
        const healthPaths: Record<string, string> = {
          gateway:      '/health',
          users:        '/users/health',
          extinguishers:'/extinguishers/health',
          inspections:  '/inspections/health',
          reports:      '/reports/health',
        };

        const statuses = await Promise.all(
          Object.entries(healthPaths).map(async ([service, path]) => {
            try {
              const res = await fetch(`${API_BASE}${path}`);
              return { service, status: res.ok ? 'OK' : 'Error' };
            } catch {
              return { service, status: 'Unreachable' };
            }
          })
        );
        setServicesStatus(statuses);

        // Extinguisher count
        try {
          const extData = await api('/extinguishers/api/extinguishers');
          setExtinguisherCount(extData.extinguishers?.length ?? 0);
        } catch {
          setExtinguisherCount(0);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="dashboard-container">Loading Dashboard...</div>;

  return (
    <div className="dashboard-container">
      <h1>FEMS Dashboard</h1>
      <p>Fire Extinguisher Management System</p>

      <h2>System Overview</h2>
      <div className="cards-grid">
        <div className="card">
          <h3>Total Extinguishers</h3>
          <p style={{ fontSize: '2rem' }}>{extinguisherCount ?? '...'}</p>
        </div>
      </div>

      <h2>Services Status</h2>
      <div className="cards-grid">
        {servicesStatus.map(({ service, status }) => (
          <div key={service} className="card">
            <h3>{service.toUpperCase()}</h3>
            <p>Status: <span className={`status-${status.toLowerCase()}`}>{status}</span></p>
          </div>
        ))}
      </div>
    </div>
  );
};
