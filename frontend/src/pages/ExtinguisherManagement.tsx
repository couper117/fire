import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Wrench } from 'lucide-react';
import { api } from '../api';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { Modal } from '../components/shared/Modal';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

interface Extinguisher {
  _id: string;
  serialNumber: string;
  location: string;
  type: string;
  size: string;
  status: string;
  installationDate: string;
  expiryDate: string;
}

const TYPES = ['Water', 'CO2', 'Foam', 'Dry Chemical'];
const SIZES = ['2.5 lbs', '5 lbs', '9 lbs', '12 lbs'];
const STATUSES = ['Active', 'Expired', 'Needs Maintenance', 'Decommissioned'];

const empty = { serialNumber: '', location: '', type: 'CO2', size: '5 lbs', status: 'Active', installationDate: '', expiryDate: '' };

export const ExtinguisherManagement = () => {
  const [items, setItems] = useState<Extinguisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Extinguisher | null>(null);
  const [editing, setEditing] = useState<Extinguisher | null>(null);
  const [form, setForm] = useState(empty);
  const [filterStatus, setFilterStatus] = useState('all');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await api('/extinguishers/api/extinguishers');
      setItems(data.extinguishers || data.data || []);
    } catch { toast.error('Failed to load extinguishers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setModalOpen(true); };
  const openEdit = (e: Extinguisher) => {
    setEditing(e);
    setForm({
      serialNumber: e.serialNumber,
      location: e.location,
      type: e.type,
      size: e.size,
      status: e.status,
      installationDate: e.installationDate?.slice(0, 10) || '',
      expiryDate: e.expiryDate?.slice(0, 10) || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.serialNumber || !form.location) { toast.error('Serial number and location are required'); return; }
    if (!form.installationDate || !form.expiryDate) { toast.error('Installation and expiry dates are required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api(`/extinguishers/api/extinguishers/${editing._id}`, { method: 'PUT', body: JSON.stringify(form) });
        toast.success('Extinguisher updated');
      } else {
        await api('/extinguishers/api/extinguishers', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Extinguisher added');
      }
      setModalOpen(false);
      load();
    } catch (err: any) { toast.error(err.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/extinguishers/api/extinguishers/${deleteTarget._id}`, { method: 'DELETE' });
      toast.success('Extinguisher deleted');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Delete failed'); }
  };

  const handleMaintenance = async (e: Extinguisher) => {
    const notes = prompt('Maintenance notes:');
    if (notes === null) return;
    try {
      await api(`/extinguishers/api/extinguishers/${e._id}/maintenance`, { method: 'POST', body: JSON.stringify({ actionTaken: notes, actionDate: new Date().toISOString(), personnel: 'Admin' }) });
      toast.success('Maintenance logged');
      load();
    } catch { toast.error('Failed to log maintenance'); }
  };

  const filtered = filterStatus === 'all' ? items : items.filter(e => e.status === filterStatus);

  const statusColor: Record<string, string> = {
    Active: 'bg-green-100 text-green-800',
    Expired: 'bg-red-100 text-red-800',
    'Needs Maintenance': 'bg-yellow-100 text-yellow-800',
    Decommissioned: 'bg-gray-100 text-gray-600',
  };

  if (loading) return <LoadingSpinner label="Loading extinguishers..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Extinguisher Management</h1>
          <p className="text-sm text-gray-500">{filtered.length} of {items.length} units</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>Add Extinguisher</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATUSES.map(s => (
          <div key={s} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">{s}</p>
            <p className="text-2xl font-bold">{items.filter(e => e.status === s).length}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              {['Serial #', 'Location', 'Type', 'Size', 'Status', 'Expiry', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No extinguishers found. Add one to get started.</td></tr>
            ) : filtered.map(e => (
              <tr key={e._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{e.serialNumber}</td>
                <td className="px-4 py-3">{e.location}</td>
                <td className="px-4 py-3">{e.type}</td>
                <td className="px-4 py-3">{e.size}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[e.status] || ''}`}>{e.status}</span>
                </td>
                <td className="px-4 py-3">{e.expiryDate ? new Date(e.expiryDate).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(e)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Pencil size={14} /></button>
                    <button onClick={() => handleMaintenance(e)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded" title="Log Maintenance"><Wrench size={14} /></button>
                    <button onClick={() => setDeleteTarget(e)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} title={editing ? 'Edit Extinguisher' : 'Add Extinguisher'} onClose={() => setModalOpen(false)} onConfirm={handleSave} size="md">
        <div className="space-y-4">
          <Input label="Serial Number" value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} placeholder="EXT-001" disabled={!!editing} />
          <Input label="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Building A, Floor 2" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}>
                {SIZES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Installation Date" type="date" value={form.installationDate} onChange={e => setForm(f => ({ ...f, installationDate: e.target.value }))} />
            <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
          </div>
        </div>
        {saving && <p className="text-sm text-blue-600 mt-2">Saving...</p>}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteTarget} title="Delete Extinguisher" onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}>
        <p>Are you sure you want to delete <strong>{deleteTarget?.serialNumber}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  );
};
