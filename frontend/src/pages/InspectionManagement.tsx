import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { api } from '../api';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { Modal } from '../components/shared/Modal';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

interface Inspection {
  _id: string;
  serialNumber: string;
  extinguisherId: string;
  scheduledAt: string;
  assignedTo: string;
  status: string;
  result: string;
  notes: string;
}

interface Extinguisher {
  _id: string;
  serialNumber: string;
  location: string;
}

const STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'Missed'];
const emptyForm = { extinguisherId: '', scheduledAt: '', assignedTo: '', status: 'Scheduled', result: '', notes: '' };

export const InspectionManagement = () => {
  const [items, setItems] = useState<Inspection[]>([]);
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Inspection | null>(null);
  const [editing, setEditing] = useState<Inspection | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState('all');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [inspData, extData] = await Promise.all([
        api('/inspections/api/inspections').catch(() => ({ inspections: [] })),
        api('/extinguishers/api/extinguishers').catch(() => ({ extinguishers: [] })),
      ]);
      setItems(inspData.inspections || inspData.data || []);
      setExtinguishers(extData.extinguishers || extData.data || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (i: Inspection) => {
    setEditing(i);
    setForm({
      extinguisherId: i.extinguisherId || '',
      scheduledAt: i.scheduledAt?.slice(0, 16) || '',
      assignedTo: i.assignedTo || '',
      status: i.status,
      result: i.result || '',
      notes: i.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.extinguisherId || !form.scheduledAt || !form.assignedTo) {
      toast.error('Extinguisher, date and assigned inspector are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api(`/inspections/api/inspections/${editing._id}`, {
          method: 'PUT',
          body: JSON.stringify({ scheduledAt: form.scheduledAt, assignedTo: form.assignedTo, status: form.status, result: form.result, notes: form.notes }),
        });
        toast.success('Inspection updated');
      } else {
        await api('/inspections/api/inspections', {
          method: 'POST',
          body: JSON.stringify({ extinguisherId: form.extinguisherId, scheduledAt: form.scheduledAt, assignedTo: form.assignedTo, notes: form.notes }),
        });
        toast.success('Inspection scheduled');
      }
      setModalOpen(false);
      load();
    } catch (err: any) { toast.error(err.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleComplete = async (i: Inspection) => {
    const result = prompt('Enter inspection result (e.g. Pass / Fail):');
    if (result === null) return;
    try {
      await api(`/inspections/api/inspections/${i._id}`, { method: 'PUT', body: JSON.stringify({ status: 'Completed', result }) });
      toast.success('Inspection marked complete');
      load();
    } catch { toast.error('Update failed'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/inspections/api/inspections/${deleteTarget._id}`, { method: 'DELETE' });
      toast.success('Inspection deleted');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Delete failed'); }
  };

  const filtered = filterStatus === 'all' ? items : items.filter(i => i.status === filterStatus);

  const statusColor: Record<string, string> = {
    Scheduled: 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-gray-100 text-gray-600',
    Missed: 'bg-red-100 text-red-800',
  };

  if (loading) return <LoadingSpinner label="Loading inspections..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspection Management</h1>
          <p className="text-sm text-gray-500">{filtered.length} of {items.length} inspections</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>Schedule Inspection</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATUSES.map(s => (
          <div key={s} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">{s}</p>
            <p className="text-2xl font-bold">{items.filter(i => i.status === s).length}</p>
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
              {['Serial #', 'Scheduled', 'Inspector', 'Status', 'Result', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No inspections found. Schedule one to get started.</td></tr>
            ) : filtered.map(i => (
              <tr key={i._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{i.serialNumber || '—'}</td>
                <td className="px-4 py-3">{i.scheduledAt ? new Date(i.scheduledAt).toLocaleString() : '—'}</td>
                <td className="px-4 py-3">{i.assignedTo}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[i.status] || ''}`}>{i.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{i.result || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(i)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Pencil size={14} /></button>
                    {i.status === 'Scheduled' && (
                      <button onClick={() => handleComplete(i)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Mark Complete"><CheckCircle size={14} /></button>
                    )}
                    <button onClick={() => setDeleteTarget(i)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} title={editing ? 'Edit Inspection' : 'Schedule Inspection'} onClose={() => setModalOpen(false)} onConfirm={handleSave} size="md">
        <div className="space-y-4">
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Extinguisher</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.extinguisherId}
                onChange={e => setForm(f => ({ ...f, extinguisherId: e.target.value }))}
              >
                <option value="">— Select extinguisher —</option>
                {extinguishers.map(e => (
                  <option key={e._id} value={e._id}>{e.serialNumber} — {e.location}</option>
                ))}
              </select>
            </div>
          )}
          <Input label="Scheduled Date & Time" type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
          <Input label="Assigned Inspector (email)" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} placeholder="inspector@company.com" />
          {editing && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <Input label="Result" value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))} placeholder="Pass / Fail / Needs attention" />
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." />
          </div>
        </div>
        {saving && <p className="text-sm text-blue-600 mt-2">Saving...</p>}
      </Modal>

      <Modal isOpen={!!deleteTarget} title="Delete Inspection" onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}>
        <p>Delete inspection for <strong>{deleteTarget?.serialNumber || 'this record'}</strong> scheduled on <strong>{deleteTarget?.scheduledAt ? new Date(deleteTarget.scheduledAt).toLocaleDateString() : '?'}</strong>?</p>
      </Modal>
    </div>
  );
};
