import { useEffect, useState } from 'react';
import { api } from './api';
import './Dashboard.css'; // Reusing some CSS

interface Extinguisher {
    id: string;
    serial_number: string;
    location: string;
    type: string;
    status: string;
}

export const ExtinguisherPage = () => {
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);

  useEffect(() => {
    api('/extinguishers/api/extinguishers').then(data => {
      setExtinguishers(data.extinguishers);
    });
  }, []);

  const total = extinguishers.length;
  const needsMaintenance = extinguishers.filter(e => e.status !== 'OK').length;

  return (
    <div className="dashboard-container">
      <h1>Extinguishers Management</h1>
      
      <div className="cards-grid">
        <div className="card">
            <h3>Total Units</h3>
            <p style={{fontSize: '2rem'}}>{total}</p>
        </div>
        <div className="card">
            <h3>Needs Attention</h3>
            <p style={{fontSize: '2rem', color: needsMaintenance > 0 ? 'red' : 'green'}}>{needsMaintenance}</p>
        </div>
      </div>

      <h2>Inventory</h2>
      <div className="cards-grid">
          {extinguishers.map(e => (
            <div key={e.id} className="card">
              <h3>{e.serial_number}</h3>
              <p><strong>Location:</strong> {e.location}</p>
              <p><strong>Type:</strong> {e.type}</p>
              <p><strong>Status:</strong> <span className={`status-${e.status}`}>{e.status}</span></p>
            </div>
          ))}
      </div>
    </div>
  );
};
