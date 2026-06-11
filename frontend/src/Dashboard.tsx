import { useEffect, useState } from 'react';
import './Dashboard.css';

interface NavData {
    name: string;
    description: string;
    endpoints: {
        documentation: Record<string, string>;
    };
    health: Record<string, string>;
}

interface ServiceStatus {
    service: string;
    status: string;
}

export const Dashboard = () => {
  const [navData, setNavData] = useState<NavData | null>(null);
  const [servicesStatus, setServicesStatus] = useState<ServiceStatus[]>([]);
  const [extinguisherCount, setExtinguisherCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api');
        if (!res.ok) throw new Error('Network response was not ok');
        const data: NavData = await res.json();
        setNavData(data);

        // Fetch health status
        const statuses = data.health ? await Promise.all(
          Object.entries(data.health).map(async ([service, path]) => {
            try {
              const res = await fetch(path);
              return { service, status: res.ok ? 'OK' : 'Error' };
            } catch {
              return { service, status: 'Unreachable' };
            }
          })
        ) : [];
        setServicesStatus(statuses);

        // Fetch extra data: extinguisher count
        try {
            const extRes = await fetch('/extinguishers/api/extinguishers');
            const extData = await extRes.json();
            setExtinguisherCount(extData.extinguishers.length);
        } catch {}
      } catch (err) {
        console.error('Failed to fetch gateway data:', err);
      }
    };

    fetchData();
  }, []);

  if (!navData) return <div className="dashboard-container">Loading Gateway...</div>;

  return (
    <div className="dashboard-container">
      <h1>{navData.name}</h1>
      <p>{navData.description}</p>
      
      <h2>System Overview</h2>
      <div className="cards-grid">
        <div className="card">
            <h3>Total Extinguishers</h3>
            <p style={{fontSize: '2rem'}}>{extinguisherCount ?? '...'}</p>
        </div>
      </div>

      <h2>Services Status</h2>
      <div className="cards-grid">
        {servicesStatus.map(({ service, status }) => (
            <div key={service} className="card">
                <h3>{service.toUpperCase()}</h3>
                <p>Status: <span className={`status-${status}`}>{status}</span></p>
            </div>
        ))}
      </div>

      <h2>Services Documentation</h2>
      <div className="cards-grid">
        {Object.entries(navData.endpoints.documentation).map(([service, url]) => (
          <div key={service} className="card">
            <h3>{service.toUpperCase()}</h3>
            <a href={url} target="_blank" rel="noreferrer">View Docs</a>
          </div>
        ))}
      </div>
    </div>
  );
};
