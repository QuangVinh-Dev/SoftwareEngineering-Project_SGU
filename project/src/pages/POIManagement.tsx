import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, MapPin } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import Modal from '@/components/modals/Modal';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useToast } from '@/components/toast/ToastProvider';
import { pois as initialPois, poiCategories } from '@/data/mockData';
import type { POI } from '@/types';
import { classNames, formatNumber } from '@/utils/helpers';

const emptyForm: Omit<POI, 'id' | 'listeningSessions' | 'avgTime'> = {
  name: '', nameEn: '', category: poiCategories[0], description: '', address: '', lat: 15.8800, lng: 108.3380, radius: 50, image: '', status: 'active',
};

export default function POIManagement() {
  const { showToast } = useToast();
  const [pois, setPois] = useState<POI[]>(initialPois);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<POI | null>(null);

  const filtered = pois.filter(p =>
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.nameEn.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === 'all' || p.status === statusFilter)
  );

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (poi: POI) => {
    setForm({
      name: poi.name, nameEn: poi.nameEn, category: poi.category, description: poi.description,
      address: poi.address, lat: poi.lat, lng: poi.lng, radius: poi.radius, image: poi.image, status: poi.status,
    });
    setEditingId(poi.id);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      showToast('warning', 'Please enter POI name.');
      return;
    }
    if (editingId !== null) {
      setPois(prev => prev.map(p => p.id === editingId ? { ...p, ...form } : p));
      showToast('success', 'POI updated successfully.');
    } else {
      const newId = Math.max(...pois.map(p => p.id)) + 1;
      setPois(prev => [...prev, { ...form, id: newId, listeningSessions: 0, avgTime: '00:00' }]);
      showToast('success', 'POI added successfully.');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setPois(prev => prev.filter(p => p.id !== deleteTarget.id));
    showToast('success', 'POI deleted successfully.');
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brown-900">POI Management</h1>
          <p className="text-sm text-brown-400 mt-1">Manage points of interest across the system.</p>
        </div>
        <Button onClick={openAdd} icon={<Plus className="w-4 h-4" />}>Add POI</Button>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-brown-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search POI by name..."
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 outline-none focus:border-primary-400 bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-brown-100 bg-brown-50/50">
                <th className="px-4 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">POI Name</th>
                <th className="px-4 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Address</th>
                <th className="px-4 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Lat / Lng</th>
                <th className="px-4 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Radius</th>
                <th className="px-4 py-3 text-right font-medium text-brown-500 text-xs uppercase tracking-wider">Sessions</th>
                <th className="px-4 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(poi => (
                <tr key={poi.id} className="border-b border-brown-50 hover:bg-brown-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-brown-800">{poi.name}</div>
                    <div className="text-xs text-brown-400">{poi.nameEn}</div>
                  </td>
                  <td className="px-4 py-3 text-brown-600">{poi.category}</td>
                  <td className="px-4 py-3 text-brown-600 max-w-[200px] truncate">{poi.address}</td>
                  <td className="px-4 py-3 text-brown-600 text-xs font-mono">{poi.lat.toFixed(4)}, {poi.lng.toFixed(4)}</td>
                  <td className="px-4 py-3 text-center text-brown-600">{poi.radius}m</td>
                  <td className="px-4 py-3 text-right text-brown-700 font-medium">{formatNumber(poi.listeningSessions)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={poi.status === 'active' ? 'active' : 'inactive'}>
                      {poi.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(poi)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(poi)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-brown-400">No POIs found.</div>
        )}

        <div className="px-4 py-3 border-t border-brown-100 flex items-center justify-between text-sm text-brown-500">
          <span>Showing {filtered.length} of {pois.length} POIs</span>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId !== null ? 'Edit POI' : 'Add POI'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brown-700 mb-1">POI Name (VN) *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-700 mb-1">POI Name (EN)</label>
              <input type="text" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brown-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brown-700 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 outline-none focus:border-primary-400 bg-white">
                {poiCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as POI['status'] })}
                className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 outline-none focus:border-primary-400 bg-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brown-700 mb-1">Address</label>
            <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-brown-700 mb-1">Latitude</label>
              <input type="number" step="0.0001" value={form.lat} onChange={e => setForm({ ...form, lat: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-700 mb-1">Longitude</label>
              <input type="number" step="0.0001" value={form.lng} onChange={e => setForm({ ...form, lng: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-700 mb-1">Radius (m)</label>
              <input type="number" value={form.radius} onChange={e => setForm({ ...form, radius: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brown-700 mb-1">Image URL</label>
            <input type="text" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
          </div>

          <div>
            <label className="block text-sm font-medium text-brown-700 mb-2">Map Preview</label>
            <div className="relative h-48 rounded-lg border border-brown-200 bg-gradient-to-br from-green-50 via-brown-50 to-blue-50 overflow-hidden">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, #d0d0d0 20px, #d0d0d0 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, #d0d0d0 20px, #d0d0d0 21px)'
              }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <MapPin className="w-10 h-10 text-primary-600 drop-shadow-lg" fill="#a85f31" />
                  <div className="absolute -inset-4 rounded-full border-2 border-primary-300/50 animate-ping" />
                </div>
              </div>
              <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg px-2 py-1 text-xs text-brown-600 shadow-sm">
                {form.lat.toFixed(4)}, {form.lng.toFixed(4)} — {form.radius}m radius
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete POI"
        message={`Are you sure you want to delete this POI? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
