import { useState } from 'react';
import { Languages, MapPin, Volume2, Shield, Play, Pause, Eye, Save, FileEdit, Send, Check } from 'lucide-react';
import { Card, CardHeader, Badge, Button, Toggle } from '@/components/ui';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useToast } from '@/components/toast/ToastProvider';
import { languages as initialLangs, ttsVoices as initialVoices } from '@/data/mockData';
import { classNames } from '@/utils/helpers';

const tabs = [
  { id: 'languages', label: 'Languages', icon: Languages },
  { id: 'radius', label: 'Default Radius', icon: MapPin },
  { id: 'tts', label: 'TTS Voices', icon: Volume2 },
  { id: 'privacy', label: 'Privacy Policy', icon: Shield },
];

const privacySections = [
  { id: 'collection', title: 'Data Collection', content: 'Hệ thống thu thập dữ liệu ẩn danh về lượt nghe thuyết minh tại các điểm tham quan. Không thu thập tên, email, số điện thoại hay bất kỳ thông tin cá nhân nào của khách du lịch.' },
  { id: 'location', title: 'Anonymous Location Data', content: 'Dữ liệu vị trí được thu thập ở dạng ẩn danh, chỉ ghi nhận tọa độ khu vực và thời gian nghe. Không theo dõi cá nhân người dùng trên bản đồ nhiệt.' },
  { id: 'purpose', title: 'Purpose of Data Usage', content: 'Dữ liệu được sử dụng để phân tích mức độ quan tâm của du khách tại từng điểm tham quan, tối ưu hóa nội dung thuyết minh và cải thiện trải nghiệm du lịch tại Hội An.' },
  { id: 'protection', title: 'Data Protection', content: 'Tất cả dữ liệu được mã hóa và lưu trữ an toàn. Chỉ quản trị viên có quyền truy cập. Dữ liệu không được chia sẻ với bên thứ ba.' },
  { id: 'retention', title: 'Data Retention', content: 'Dữ liệu nghe ẩn danh được lưu trữ trong 12 tháng. Sau thời gian này, dữ liệu được tự động xóa vĩnh viễn.' },
  { id: 'rights', title: 'User Rights', content: 'Du khách có quyền biết hệ thống thu thập dữ liệu gì. Vì dữ liệu hoàn toàn ẩn danh, không thể liên kết với cá nhân cụ thể.' },
];

export default function Settings() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('languages');
  const [langs, setLangs] = useState(initialLangs);
  const [voices, setVoices] = useState(initialVoices);
  const [radius, setRadius] = useState(50);
  const [autoApply, setAutoApply] = useState(true);
  const [previewVoice, setPreviewVoice] = useState<number | null>(null);
  const [privacyDraft, setPrivacyDraft] = useState(privacySections);
  const [publishConfirm, setPublishConfirm] = useState(false);

  const toggleLang = (id: number) => {
    setLangs(prev => prev.map(l => l.id === id ? { ...l, status: !l.status } : l));
    const lang = langs.find(l => l.id === id);
    showToast('success', `${lang?.name} ${lang?.status ? 'disabled' : 'enabled'} successfully.`);
  };

  const setDefaultLang = (id: number) => {
    setLangs(prev => prev.map(l => ({ ...l, isDefault: l.id === id })));
    showToast('success', 'Default language updated.');
  };

  const toggleVoice = (id: number) => {
    setVoices(prev => prev.map(v => v.id === id ? { ...v, status: !v.status } : v));
    const voice = voices.find(v => v.id === id);
    showToast('success', `Voice ${voice?.voice} ${voice?.status ? 'disabled' : 'enabled'} successfully.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-900">System Settings</h1>
        <p className="text-sm text-brown-400 mt-1">Configure languages, radius, voices, and privacy policy.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible scrollbar-thin pb-2 lg:pb-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={classNames(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                    activeTab === tab.id ? 'bg-primary-600 text-white' : 'text-brown-600 hover:bg-brown-50'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === 'languages' && (
            <Card noPadding>
              <div className="p-5 pb-3">
                <CardHeader title="Languages" subtitle="Manage available languages for audio content" />
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-y border-brown-100 bg-brown-50/50">
                      <th className="px-5 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Language</th>
                      <th className="px-5 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Code</th>
                      <th className="px-5 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Default</th>
                      <th className="px-5 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {langs.map(l => (
                      <tr key={l.id} className="border-b border-brown-50 hover:bg-brown-50/30 transition-colors">
                        <td className="px-5 py-3 font-medium text-brown-800">{l.name}</td>
                        <td className="px-5 py-3 text-brown-500 font-mono text-xs">{l.code}</td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center">
                            <Toggle size="sm" checked={l.status} onChange={() => toggleLang(l.id)} />
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => setDefaultLang(l.id)}
                            className={classNames(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center mx-auto transition-colors',
                              l.isDefault ? 'border-primary-600 bg-primary-600' : 'border-brown-200 hover:border-primary-400'
                            )}
                          >
                            {l.isDefault && <Check className="w-3 h-3 text-white" />}
                          </button>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant={l.status ? 'active' : 'inactive'}>
                            {l.status ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'radius' && (
            <Card>
              <CardHeader title="Default POI Radius" subtitle="Set the default trigger radius for new POIs" />
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-brown-700">Radius Value</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={radius}
                        onChange={e => setRadius(Math.max(10, Math.min(200, parseInt(e.target.value) || 10)))}
                        className="w-20 px-3 py-1.5 rounded-lg border border-brown-200 text-sm text-center font-semibold text-brown-800 outline-none focus:border-primary-400"
                      />
                      <span className="text-sm text-brown-500">meters</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={200}
                    value={radius}
                    onChange={e => setRadius(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-brown-400 mt-1">
                    <span>10m</span>
                    <span>50m</span>
                    <span>100m</span>
                    <span>150m</span>
                    <span>200m</span>
                  </div>
                </div>

                <div className="relative h-48 rounded-xl border border-brown-200 bg-gradient-to-br from-green-50 via-brown-50 to-blue-50 overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, #d0d0d0 20px, #d0d0d0 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, #d0d0d0 20px, #d0d0d0 21px)'
                  }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div
                        className="absolute rounded-full border-2 border-primary-300/40 bg-primary-200/20"
                        style={{
                          width: `${radius * 1.5}px`,
                          height: `${radius * 1.5}px`,
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                      <MapPin className="w-8 h-8 text-primary-600 relative z-10" fill="#a85f31" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg px-2 py-1 text-xs text-brown-600 shadow-sm">
                    Radius: {radius}m
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-brown-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-brown-800">Automatically apply to new POIs</p>
                    <p className="text-xs text-brown-400">New POIs will use this radius by default</p>
                  </div>
                  <Toggle checked={autoApply} onChange={setAutoApply} />
                </div>

                <Button onClick={() => showToast('success', 'Changes saved successfully.')} icon={<Save className="w-4 h-4" />}>
                  Save Changes
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'tts' && (
            <Card noPadding>
              <div className="p-5 pb-3">
                <CardHeader title="TTS Voices" subtitle="Manage text-to-speech voices for each language" />
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-y border-brown-100 bg-brown-50/50">
                      <th className="px-5 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Voice</th>
                      <th className="px-5 py-3 text-left font-medium text-brown-500 text-xs uppercase tracking-wider">Language</th>
                      <th className="px-5 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Gender</th>
                      <th className="px-5 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Preview</th>
                      <th className="px-5 py-3 text-center font-medium text-brown-500 text-xs uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voices.map(v => (
                      <tr key={v.id} className="border-b border-brown-50 hover:bg-brown-50/30 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-brown-700">{v.voice}</td>
                        <td className="px-5 py-3 text-brown-600">{v.language}</td>
                        <td className="px-5 py-3 text-center text-brown-600">{v.gender}</td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant={v.status ? 'active' : 'inactive'}>
                            {v.status ? 'ON' : 'OFF'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => setPreviewVoice(previewVoice === v.id ? null : v.id)}
                            className={classNames(
                              'p-1.5 rounded-lg transition-colors',
                              previewVoice === v.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-blue-50 text-blue-500'
                            )}
                          >
                            {previewVoice === v.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Toggle size="sm" checked={v.status} onChange={() => toggleVoice(v.id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewVoice !== null && (
                <div className="px-5 py-3 bg-blue-50 border-t border-brown-100 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                  <span className="text-xs text-blue-600 font-medium">Previewing {voices.find(v => v.id === previewVoice)?.voice}...</span>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <Card>
                <CardHeader title="Privacy Policy Editor" subtitle="Edit the privacy policy content for the system" />
                <div className="space-y-4">
                  {privacyDraft.map((section, i) => (
                    <div key={section.id}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <FileEdit className="w-4 h-4 text-primary-500" />
                        <input
                          type="text"
                          value={section.title}
                          onChange={e => setPrivacyDraft(prev => prev.map((s, idx) => idx === i ? { ...s, title: e.target.value } : s))}
                          className="text-sm font-semibold text-brown-800 bg-transparent border-b border-transparent hover:border-brown-200 focus:border-primary-400 outline-none flex-1"
                        />
                      </div>
                      <textarea
                        value={section.content}
                        onChange={e => setPrivacyDraft(prev => prev.map((s, idx) => idx === i ? { ...s, content: e.target.value } : s))}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-brown-200 text-sm text-brown-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 resize-y"
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="secondary" onClick={() => showToast('info', 'Draft saved.')} icon={<Save className="w-4 h-4" />} className="flex-1">
                    Save Draft
                  </Button>
                  <Button variant="secondary" onClick={() => showToast('info', 'Preview opened.')} icon={<Eye className="w-4 h-4" />} className="flex-1">
                    Preview
                  </Button>
                  <Button onClick={() => setPublishConfirm(true)} icon={<Send className="w-4 h-4" />} className="flex-1">
                    Publish
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={publishConfirm}
        onClose={() => setPublishConfirm(false)}
        onConfirm={() => showToast('success', 'Privacy Policy published successfully.')}
        title="Publish Privacy Policy"
        message="Are you sure you want to publish the privacy policy? This will make it visible to all users."
        confirmLabel="Publish"
        variant="warning"
      />
    </div>
  );
}
