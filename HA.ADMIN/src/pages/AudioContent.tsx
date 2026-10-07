import { useState } from 'react';
import { Play, Pause, Edit2, Trash2, Search, Headphones, Volume2 } from 'lucide-react';
import { Card, Badge, Button, Toggle } from '@/components/ui';
import Modal from '@/components/modals/Modal';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useToast } from '@/components/toast/ToastProvider';
import { audioContents as initialAudio, pois, languages } from '@/data/mockData';
import type { AudioContent } from '@/types';

export default function AudioContent() {
  const { showToast } = useToast();
  const [items, setItems] = useState<AudioContent[]>(initialAudio);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [previewItem, setPreviewItem] = useState<AudioContent | null>(null);
  const [editItem, setEditItem] = useState<AudioContent | null>(null);
  const [deleteItem, setDeleteItem] = useState<AudioContent | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const filtered = items.filter(a =>
    (a.title.toLowerCase().includes(search.toLowerCase()) || a.poiName.toLowerCase().includes(search.toLowerCase())) &&
    (langFilter === 'all' || a.language === langFilter) &&
    (statusFilter === 'all' || a.status === statusFilter)
  );

  const toggleStatus = (id: number) => {
    setItems(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'enabled' ? 'disabled' : 'enabled' } : a));
    const item = items.find(a => a.id === id);
    showToast('success', `${item?.title} ${item?.status === 'enabled' ? 'disabled' : 'enabled'} successfully.`);
  };

  const handleSaveEdit = () => {
    if (!editItem) return;
    if (!editItem.title.trim()) {
      showToast('warning', 'Please enter audio title.');
      return;
    }
    setItems(prev => prev.map(a => a.id === editItem.id ? editItem : a));
    showToast('success', 'Audio content updated successfully.');
    setEditItem(null);
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    setItems(prev => prev.filter(a => a.id !== deleteItem.id));
    showToast('success', 'Audio content deleted successfully.');
    setDeleteItem(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-900">Audio Content</h1>
        <p className="text-sm text-brown-400 mt-1">Manage TTS audio content for each POI and language.</p>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-brown-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or POI..."
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <select value={langFilter} onChange={e => setLangFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 outline-none focus:border-primary-400 bg-white">
            <option value="all">All Languages</option>
            {languages.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 outline-none focus:border-primary-400 bg-white">
            <option value="all">All Status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-brown-100 bg-brown-50/50">
                <th className="px-4 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">POI</th>
                <th className="px-4 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Language</th>
                <th className="px-4 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Audio Title</th>
                <th className="px-4 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">TTS Voice</th>
                <th className="px-4 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Duration</th>
                <th className="px-4 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className="border-b border-brown-50 hover:bg-brown-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-brown-800">{a.poiName}</td>
                  <td className="px-4 py-3 text-brown-600">{a.language}</td>
                  <td className="px-4 py-3 text-brown-700">{a.title}</td>
                  <td className="px-4 py-3 text-brown-500 text-xs font-mono">{a.ttsVoice}</td>
                  <td className="px-4 py-3 text-center text-brown-600 font-mono">{a.duration}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={a.status === 'enabled' ? 'enabled' : 'disabled'}>
                      {a.status === 'enabled' ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setPreviewItem(a); setIsPlaying(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Preview">
                        <Play className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditItem(a)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <Toggle size="sm" checked={a.status === 'enabled'} onChange={() => toggleStatus(a.id)} />
                      <button onClick={() => setDeleteItem(a)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Delete">
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
          <div className="px-4 py-12 text-center text-sm text-brown-400">No audio content found.</div>
        )}

        <div className="px-4 py-3 border-t border-brown-100 text-sm text-brown-500">
          Showing {filtered.length} of {items.length} audio tracks
        </div>
      </Card>

      <Modal
        open={!!previewItem}
        onClose={() => { setPreviewItem(null); setIsPlaying(false); }}
        title="Audio Preview"
        size="sm"
      >
        {previewItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-brown-50 rounded-xl">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-gold-500 flex items-center justify-center flex-shrink-0">
                {isPlaying ? <Pause className="w-7 h-7 text-white" /> : <Headphones className="w-7 h-7 text-white" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brown-900 truncate">{previewItem.title}</p>
                <p className="text-xs text-brown-400">{previewItem.poiName} — {previewItem.language}</p>
                <p className="text-xs text-brown-500 mt-1 font-mono">{previewItem.ttsVoice}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-brown-400 mb-1">
                <span>0:00</span>
                <span>{previewItem.duration}</span>
              </div>
              <div className="h-2 bg-brown-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-gold-500 rounded-full transition-all"
                  style={{ width: isPlaying ? '45%' : '0%' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => setIsPlaying(!isPlaying)} icon={isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}>
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setPreviewItem(null); setIsPlaying(false); }}>Close</Button>
            </div>
            <p className="text-center text-xs text-brown-400">This is a simulated preview — no actual audio playback.</p>
          </div>
        )}
      </Modal>

      <Modal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        title="Edit Audio Content"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </>
        }
      >
        {editItem && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brown-700 mb-1">Audio Title</label>
              <input type="text" value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">POI</label>
                <select value={editItem.poiId} onChange={e => {
                  const poi = pois.find(p => p.id === parseInt(e.target.value));
                  setEditItem({ ...editItem, poiId: parseInt(e.target.value), poiName: poi?.name || '' });
                }} className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 outline-none focus:border-primary-400 bg-white">
                  {pois.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Language</label>
                <select value={editItem.language} onChange={e => setEditItem({ ...editItem, language: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 outline-none focus:border-primary-400 bg-white">
                  {languages.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-700 mb-1">TTS Voice</label>
              <input type="text" value={editItem.ttsVoice} onChange={e => setEditItem({ ...editItem, ttsVoice: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm font-mono outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-700 mb-1">Duration</label>
              <input type="text" value={editItem.duration} onChange={e => setEditItem({ ...editItem, duration: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm font-mono outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Audio Content"
        message={`Are you sure you want to delete "${deleteItem?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
