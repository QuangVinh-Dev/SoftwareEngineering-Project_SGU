import { useState } from 'react';
import { Search, Headphones, Play, Pause, Upload, Edit2, Save, X } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/components/toast/ToastProvider';
import { audioContents as initialAudio, myPois, ttsVoices, languages } from '@/data/mockData';
import type { AudioContent } from '@/types';

const statusLabels: Record<string, string> = {
  enabled: 'Đang bật',
  disabled: 'Đang tắt',
};

export default function AudioContentPage() {
  const { showToast } = useToast();
  const { setCurrentPage } = useApp();
  const [items, setItems] = useState<AudioContent[]>(initialAudio);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editItem, setEditItem] = useState<AudioContent | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ poiId: '', language: '', title: '', description: '' });

  const filtered = items.filter(a =>
    (a.title.toLowerCase().includes(search.toLowerCase()) || a.poiName.toLowerCase().includes(search.toLowerCase())) &&
    (langFilter === 'all' || a.language === langFilter) &&
    (statusFilter === 'all' || a.status === statusFilter)
  );

  const togglePlay = (id: number) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
      setTimeout(() => setPlayingId(null), 3000);
    }
  };

  const toggleStatus = (id: number) => {
    setItems(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'enabled' ? 'disabled' : 'enabled' } : a));
    const item = items.find(a => a.id === id);
    showToast('success', `Đã ${item?.status === 'enabled' ? 'tắt' : 'bật'} nội dung audio: ${item?.title}`);
  };

  const handleUpload = () => {
    if (!uploadForm.poiId || !uploadForm.language || !uploadForm.title.trim()) {
      showToast('error', 'Vui lòng chọn POI, ngôn ngữ và nhập tiêu đề audio.');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          setUploadProgress(0);
          const poi = myPois.find(p => p.id === Number(uploadForm.poiId));
          const newAudio: AudioContent = {
            id: items.length + 1,
            poiId: Number(uploadForm.poiId),
            poiName: poi?.name || '',
            language: uploadForm.language,
            title: uploadForm.title,
            ttsVoice: ttsVoices.find(v => v.language === uploadForm.language)?.voice || '',
            duration: '00:00',
            status: 'disabled',
          };
          setItems(prev => [...prev, newAudio]);
          setUploadOpen(false);
          setUploadForm({ poiId: '', language: '', title: '', description: '' });
          showToast('success', 'Tải lên audio thành công. Nội dung đang chờ duyệt.');
          return 0;
        }
        return p + 20;
      });
    }, 200);
  };

  const handleEditSave = () => {
    if (!editItem) return;
    if (!editItem.title.trim()) {
      showToast('error', 'Vui lòng nhập tiêu đề audio.');
      return;
    }
    setItems(prev => prev.map(a => a.id === editItem.id ? editItem : a));
    setEditItem(null);
    showToast('success', 'Cập nhật nội dung audio thành công.');
  };

  const approvedPois = myPois.filter(p => p.approvalStatus === 'approved');
  const activeLangs = languages.filter(l => l.status);
  const inputCls = 'w-full px-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brown-900">Nội dung audio của tôi</h1>
          <p className="text-sm text-brown-400 mt-1">Quản lý nội dung thuyết minh thuộc POI của bạn.</p>
        </div>
        <Button onClick={() => setUploadOpen(true)} icon={<Upload className="w-4 h-4" />}>Tải lên audio</Button>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-brown-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề hoặc POI..."
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-brown-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
          </div>
          <select value={langFilter} onChange={e => setLangFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 outline-none focus:border-primary-400 bg-white">
            <option value="all">Tất cả ngôn ngữ</option>
            {activeLangs.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 outline-none focus:border-primary-400 bg-white">
            <option value="all">Tất cả trạng thái</option>
            <option value="enabled">Đang bật</option>
            <option value="disabled">Đang tắt</option>
          </select>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-brown-100 bg-brown-50/50">
                <th className="px-4 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">POI</th>
                <th className="px-4 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Ngôn ngữ</th>
                <th className="px-4 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Tiêu đề audio</th>
                <th className="px-4 py-3 text-right font-medium text-brown-500 text-xs uppercase tracking-wider">Thời lượng</th>
                <th className="px-4 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(audio => (
                <tr key={audio.id} className="border-b border-brown-50 hover:bg-brown-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-brown-800">{audio.poiName}</td>
                  <td className="px-4 py-3 text-brown-600">{audio.language}</td>
                  <td className="px-4 py-3 text-brown-700">{audio.title}</td>
                  <td className="px-4 py-3 text-right text-brown-600 font-mono">{audio.duration}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={audio.status === 'enabled' ? 'enabled' : 'disabled'}>
                      {statusLabels[audio.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => togglePlay(audio.id)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors" title="Ph thử">
                        {playingId === audio.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setEditItem(audio)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Chỉnh sửa">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleStatus(audio.id)} className={`p-1.5 rounded-lg transition-colors ${audio.status === 'enabled' ? 'hover:bg-orange-50 text-orange-600' : 'hover:bg-green-50 text-green-600'}`} title={audio.status === 'enabled' ? 'Tắt' : 'Bật'}>
                        <Headphones className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-brown-400">Không tìm thấy nội dung audio nào.</div>
        )}

        <div className="px-4 py-3 border-t border-brown-100 text-sm text-brown-500">
          Hiển thị {filtered.length} trong tổng số {items.length} nội dung audio
        </div>
      </Card>

      {uploadOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in" onClick={() => !uploading && setUploadOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-brown-100">
              <h2 className="text-lg font-semibold text-brown-900">Tải lên nội dung audio</h2>
              <button onClick={() => !uploading && setUploadOpen(false)} className="p-1 rounded-lg hover:bg-brown-50 text-brown-400 hover:text-brown-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">POI <span className="text-red-500">*</span></label>
                <select value={uploadForm.poiId} onChange={e => setUploadForm({ ...uploadForm, poiId: e.target.value })} className={`${inputCls} bg-white`}>
                  <option value="">Chọn POI</option>
                  {approvedPois.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Ngôn ngữ <span className="text-red-500">*</span></label>
                <select value={uploadForm.language} onChange={e => setUploadForm({ ...uploadForm, language: e.target.value })} className={`${inputCls} bg-white`}>
                  <option value="">Chọn ngôn ngữ</option>
                  {activeLangs.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Tiêu đề audio <span className="text-red-500">*</span></label>
                <input type="text" value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} className={inputCls} placeholder="VD: Lịch sử Chùa Cầu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Mô tả</label>
                <textarea value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })} rows={3} className={`${inputCls} resize-none`} placeholder="Mô tả ngắn gọn về nội dung audio" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Tệp audio</label>
                <div className="border-2 border-dashed border-brown-200 rounded-lg p-6 text-center hover:border-primary-300 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-brown-300 mx-auto mb-2" />
                  <p className="text-sm text-brown-500">Nhấn để chọn tệp audio</p>
                  <p className="text-xs text-brown-400 mt-1">Hỗ trợ MP3, WAV (tối đa 50MB)</p>
                </div>
                {uploading && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-brown-500 mb-1">
                      <span>Đang tải lên...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-brown-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-600 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brown-100">
              <Button variant="secondary" onClick={() => setUploadOpen(false)} disabled={uploading}>Hủy</Button>
              <Button onClick={handleUpload} disabled={uploading} icon={<Upload className="w-4 h-4" />}>{uploading ? 'Đang tải...' : 'Tải lên'}</Button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in" onClick={() => setEditItem(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-brown-100">
              <h2 className="text-lg font-semibold text-brown-900">Chỉnh sửa nội dung audio</h2>
              <button onClick={() => setEditItem(null)} className="p-1 rounded-lg hover:bg-brown-50 text-brown-400 hover:text-brown-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">POI</label>
                <input type="text" value={editItem.poiName} disabled className={`${inputCls} bg-brown-50 text-brown-500`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Ngôn ngữ</label>
                <input type="text" value={editItem.language} disabled className={`${inputCls} bg-brown-50 text-brown-500`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Tiêu đề audio</label>
                <input type="text" value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Giọng đọc TTS</label>
                <input type="text" value={editItem.ttsVoice} disabled className={`${inputCls} bg-brown-50 text-brown-500`} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brown-100">
              <Button variant="secondary" onClick={() => setEditItem(null)}>Hủy</Button>
              <Button onClick={handleEditSave} icon={<Save className="w-4 h-4" />}>Lưu</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
