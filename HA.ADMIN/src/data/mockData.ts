import type { POI, Language, AudioContent, ListeningHistoryEntry, TTSVoice, ActivityLog, NotificationItem } from '@/types';

export const pois: POI[] = [
  { id: 1, name: 'Chùa Cầu', nameEn: 'Japanese Covered Bridge', category: 'Di tích lịch sử', description: 'Biểu tượng của Hội An, cây cầu Nhật Bản được xây dựng vào thế kỷ 17 bởi thương nhân Nhật Bản.', address: 'Nguyễn Thị Minh Khai, Cẩm Châu, Hội An', lat: 15.8805, lng: 108.3380, radius: 50, image: '', listeningSessions: 3248, avgTime: '07:12', status: 'active' },
  { id: 2, name: 'Hội quán Phúc Kiến', nameEn: 'Fukian Assembly Hall', category: 'Hội quán', description: 'Hội quán của cộng đồng người Hoa gốc Phúc Kiến, kiến trúc rực rỡ với rồng phượng.', address: '46 Trần Phú, Cẩm Châu, Hội An', lat: 15.8782, lng: 108.3370, radius: 50, image: '', listeningSessions: 2856, avgTime: '06:48', status: 'active' },
  { id: 3, name: 'Nhà cổ Tấn Ký', nameEn: 'Tan Ky Old House', category: 'Nhà cổ', description: 'Nhà cổ gần 200 năm tuổi, kết hợp kiến trúc Việt Nam, Nhật Bản và Trung Hoa.', address: '101 Nguyễn Thái Học, Cẩm Châu, Hội An', lat: 15.8792, lng: 108.3375, radius: 50, image: '', listeningSessions: 2415, avgTime: '06:35', status: 'active' },
  { id: 4, name: 'Chợ Hội An', nameEn: 'Hoi An Market', category: 'Chợ truyền thống', description: 'Chợ truyền thống nhộn nhịp bờ sông Hoài, nơi giao thương đặc sản Hội An.', address: 'Đường Trần Phú, Cẩm Châu, Hội An', lat: 15.8810, lng: 108.3390, radius: 70, image: '', listeningSessions: 1982, avgTime: '05:54', status: 'active' },
  { id: 5, name: 'Nhà cổ Phùng Hưng', nameEn: 'Phung Hung Old House', category: 'Nhà cổ', description: 'Nhà cổ 2 tầng kiến trúc độc đáo, kết hợp gỗ quý và gốm sứ cổ.', address: '4 Nguyễn Thị Minh Khai, Cẩm Châu, Hội An', lat: 15.8801, lng: 108.3385, radius: 50, image: '', listeningSessions: 1654, avgTime: '06:21', status: 'active' },
  { id: 6, name: 'Chùa Pháp Bảo', nameEn: 'Phap Bao Pagoda', category: 'Chùa', description: 'Chùa Phật giáo với kiến trúc thanh tịnh, gần khu phố cổ Hội An.', address: 'Khu phố cổ, Cẩm Châu, Hội An', lat: 15.8785, lng: 108.3360, radius: 50, image: '', listeningSessions: 1320, avgTime: '06:05', status: 'active' },
  { id: 7, name: 'Hội quán Quảng Đông', nameEn: 'Cantonese Assembly Hall', category: 'Hội quán', description: 'Hội quán của cộng đồng người Hoa gốc Quảng Đông với tượng rồng tinh xảo.', address: '176 Trần Phú, Cẩm Châu, Hội An', lat: 15.8775, lng: 108.3365, radius: 50, image: '', listeningSessions: 1105, avgTime: '05:42', status: 'active' },
  { id: 8, name: 'Bảo tàng Văn hóa Sa Huỳnh', nameEn: 'Sa Huynh Culture Museum', category: 'Bảo tàng', description: 'Bảo tàng trưng bày hiện vật văn hóa Sa Huỳnh cách đây 2.000 năm.', address: '149 Trần Phú, Cẩm Châu, Hội An', lat: 15.8780, lng: 108.3372, radius: 50, image: '', listeningSessions: 875, avgTime: '06:18', status: 'active' },
  { id: 9, name: 'Sông Hoài', nameEn: 'Hoai River', category: 'Danh lam thắng cảnh', description: 'Con sông êm đềm chảy qua phố cổ, nổi tiếng với thuyền hoa đăng.', address: 'Khu phố cổ, Cẩm Châu, Hội An', lat: 15.8795, lng: 108.3382, radius: 100, image: '', listeningSessions: 2156, avgTime: '05:30', status: 'active' },
  { id: 10, name: 'Chợ đêm Hội An', nameEn: 'Hoi An Night Market', category: 'Chợ truyền thống', description: 'Chợ đêm sầm uất với đèn lồng sắc màu và ẩm thực địa phương.', address: 'Đường Nguyễn Hoàng, Cẩm Châu, Hội An', lat: 15.8815, lng: 108.3395, radius: 80, image: '', listeningSessions: 1542, avgTime: '04:55', status: 'active' },
];

export const poiCategories = ['Di tích lịch sử', 'Hội quán', 'Nhà cổ', 'Chùa', 'Bảo tàng', 'Danh lam thắng cảnh', 'Chợ truyền thống'];

export const languages: Language[] = [
  { id: 1, name: 'Vietnamese', code: 'vi', status: true, isDefault: true },
  { id: 2, name: 'English', code: 'en', status: true, isDefault: false },
  { id: 3, name: 'Chinese', code: 'zh', status: true, isDefault: false },
  { id: 4, name: 'Japanese', code: 'ja', status: true, isDefault: false },
  { id: 5, name: 'Korean', code: 'ko', status: true, isDefault: false },
  { id: 6, name: 'French', code: 'fr', status: false, isDefault: false },
];

export const audioContents: AudioContent[] = [
  { id: 1, poiId: 1, poiName: 'Chùa Cầu', language: 'Vietnamese', title: 'Lịch sử Chùa Cầu', ttsVoice: 'vi-VN-HoaiTrang', duration: '07:12', status: 'enabled' },
  { id: 2, poiId: 1, poiName: 'Chùa Cầu', language: 'English', title: 'History of Japanese Bridge', ttsVoice: 'en-US-JennyNeural', duration: '06:55', status: 'enabled' },
  { id: 3, poiId: 1, poiName: 'Chùa Cầu', language: 'Japanese', title: '来迎橋の歴史', ttsVoice: 'ja-JP-Nanami', duration: '07:30', status: 'enabled' },
  { id: 4, poiId: 1, poiName: 'Chùa Cầu', language: 'Chinese', title: '廊桥的历史', ttsVoice: 'zh-CN-XiaoxiaoNeural', duration: '06:40', status: 'enabled' },
  { id: 5, poiId: 1, poiName: 'Chùa Cầu', language: 'Korean', title: '일본 다리의 역사', ttsVoice: 'ko-KR-JiMin', duration: '06:50', status: 'enabled' },
  { id: 6, poiId: 1, poiName: 'Chùa Cầu', language: 'French', title: 'Histoire du Pont Japonais', ttsVoice: 'fr-FR-DeniseNeural', duration: '07:15', status: 'disabled' },
  { id: 7, poiId: 2, poiName: 'Hội quán Phúc Kiến', language: 'Vietnamese', title: 'Hội quán Phúc Kiến', ttsVoice: 'vi-VN-NamMinh', duration: '06:48', status: 'enabled' },
  { id: 8, poiId: 2, poiName: 'Hội quán Phúc Kiến', language: 'English', title: 'Fukian Assembly Hall', ttsVoice: 'en-US-GuyNeural', duration: '06:20', status: 'enabled' },
  { id: 9, poiId: 2, poiName: 'Hội quán Phúc Kiến', language: 'Chinese', title: '福建会馆', ttsVoice: 'zh-CN-YunxiNeural', duration: '06:35', status: 'enabled' },
  { id: 10, poiId: 3, poiName: 'Nhà cổ Tấn Ký', language: 'Vietnamese', title: 'Nhà cổ Tấn Ký', ttsVoice: 'vi-VN-HoaiTrang', duration: '06:35', status: 'enabled' },
  { id: 11, poiId: 3, poiName: 'Nhà cổ Tấn Ký', language: 'English', title: 'Tan Ky Old House', ttsVoice: 'en-US-JennyNeural', duration: '06:10', status: 'enabled' },
  { id: 12, poiId: 3, poiName: 'Nhà cổ Tấn Ký', language: 'Japanese', title: 'タンキー旧家', ttsVoice: 'ja-JP-KeitaNeural', duration: '06:25', status: 'enabled' },
  { id: 13, poiId: 4, poiName: 'Chợ Hội An', language: 'Vietnamese', title: 'Chợ truyền thống Hội An', ttsVoice: 'vi-VN-NamMinh', duration: '05:54', status: 'enabled' },
  { id: 14, poiId: 4, poiName: 'Chợ Hội An', language: 'English', title: 'Hoi An Market', ttsVoice: 'en-US-AriaNeural', duration: '05:20', status: 'enabled' },
  { id: 15, poiId: 5, poiName: 'Nhà cổ Phùng Hưng', language: 'Vietnamese', title: 'Nhà cổ Phùng Hưng', ttsVoice: 'vi-VN-HoaiTrang', duration: '06:21', status: 'enabled' },
  { id: 16, poiId: 5, poiName: 'Nhà cổ Phùng Hưng', language: 'English', title: 'Phung Hung Old House', ttsVoice: 'en-US-GuyNeural', duration: '05:55', status: 'enabled' },
  { id: 17, poiId: 6, poiName: 'Chùa Pháp Bảo', language: 'Vietnamese', title: 'Chùa Pháp Bảo', ttsVoice: 'vi-VN-NamMinh', duration: '06:05', status: 'enabled' },
  { id: 18, poiId: 6, poiName: 'Chùa Pháp Bảo', language: 'English', title: 'Phap Bao Pagoda', ttsVoice: 'en-US-JennyNeural', duration: '05:40', status: 'enabled' },
  { id: 19, poiId: 9, poiName: 'Sông Hoài', language: 'Vietnamese', title: 'Dòng sông Hoài', ttsVoice: 'vi-VN-HoaiTrang', duration: '05:30', status: 'enabled' },
  { id: 20, poiId: 9, poiName: 'Sông Hoài', language: 'English', title: 'The Hoai River', ttsVoice: 'en-US-AriaNeural', duration: '05:10', status: 'enabled' },
];

export const ttsVoices: TTSVoice[] = [
  { id: 1, voice: 'vi-VN-NamMinh', language: 'Vietnamese', gender: 'Male', status: true },
  { id: 2, voice: 'vi-VN-HoaiTrang', language: 'Vietnamese', gender: 'Female', status: true },
  { id: 3, voice: 'en-US-GuyNeural', language: 'English', gender: 'Male', status: true },
  { id: 4, voice: 'en-US-JennyNeural', language: 'English', gender: 'Female', status: true },
  { id: 5, voice: 'en-US-AriaNeural', language: 'English', gender: 'Female', status: false },
  { id: 6, voice: 'zh-CN-XiaoxiaoNeural', language: 'Chinese', gender: 'Female', status: true },
  { id: 7, voice: 'zh-CN-YunxiNeural', language: 'Chinese', gender: 'Male', status: true },
  { id: 8, voice: 'ja-JP-Nanami', language: 'Japanese', gender: 'Female', status: true },
  { id: 9, voice: 'ja-JP-KeitaNeural', language: 'Japanese', gender: 'Male', status: true },
  { id: 10, voice: 'ko-KR-JiMin', language: 'Korean', gender: 'Female', status: true },
  { id: 11, voice: 'fr-FR-DeniseNeural', language: 'French', gender: 'Female', status: false },
  { id: 12, voice: 'fr-FR-HenriNeural', language: 'French', gender: 'Male', status: false },
];

const devices = ['iPhone 15', 'Samsung Galaxy S24', 'iPad Pro', 'Google Pixel 8', 'Xiaomi Redmi Note 12', 'iPhone 14', 'Samsung A55', 'Oppo Reno 11'];
const histStatuses: ListeningHistoryEntry['status'][] = ['completed', 'completed', 'completed', 'partial', 'completed', 'skipped'];
const poiNames = pois.map(p => p.name);
const langNames = ['Vietnamese', 'English', 'Chinese', 'Japanese', 'Korean', 'French'];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const listeningHistory: ListeningHistoryEntry[] = Array.from({ length: 120 }, (_, i) => {
  const date = new Date(2026, 9, 7);
  date.setDate(date.getDate() - Math.floor(i / 6));
  date.setHours(8 + (i % 14), (i * 7) % 60, 0);
  const poiIdx = Math.floor(seededRandom(i + 1) * poiNames.length);
  const langIdx = Math.floor(seededRandom(i + 100) * langNames.length);
  const devIdx = Math.floor(seededRandom(i + 200) * devices.length);
  const min = 3 + Math.floor(seededRandom(i + 300) * 7);
  const sec = Math.floor(seededRandom(i + 400) * 60);
  const statusIdx = Math.floor(seededRandom(i + 500) * histStatuses.length);
  return {
    id: i + 1,
    datetime: date.toISOString().slice(0, 16).replace('T', ' '),
    poi: poiNames[poiIdx],
    language: langNames[langIdx],
    duration: `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`,
    device: devices[devIdx],
    status: histStatuses[statusIdx],
  };
});

export const activityLogs: ActivityLog[] = [
  { id: 1, time: '08:45', action: 'Updated POI: Chùa Cầu', icon: 'edit' },
  { id: 2, time: '08:32', action: 'Enabled language: Japanese', icon: 'languages' },
  { id: 3, time: '08:10', action: 'Exported Monthly Listening Report', icon: 'download' },
  { id: 4, time: '07:55', action: 'Logged into Admin Portal', icon: 'login' },
  { id: 5, time: '07:40', action: 'Added POI: Chùa Pháp Bảo', icon: 'plus' },
  { id: 6, time: '07:20', action: 'Updated Privacy Policy', icon: 'shield' },
  { id: 7, time: '06:55', action: 'Disabled audio content: French — Chùa Cầu', icon: 'pause' },
];

export const notifications: NotificationItem[] = [
  { id: 1, title: 'POI mới được thêm', message: 'Chùa Pháp Bảo vừa được thêm vào hệ thống.', time: '2 phút trước', read: false, type: 'poi', link: 'poi' },
  { id: 2, title: 'Báo cáo đã sẵn sàng', message: 'Báo cáo lượt nghe tháng này đã được tạo.', time: '15 phút trước', read: false, type: 'report', link: 'reports' },
  { id: 3, title: 'Ngôn ngữ được cập nhật', message: 'Tiếng Nhật đã được bật.', time: '1 giờ trước', read: false, type: 'language', link: 'settings' },
  { id: 4, title: 'Chính sách quyền riêng tư cập nhật', message: 'Privacy Policy đã được publish.', time: '3 giờ trước', read: true, type: 'system', link: 'settings' },
];

export const languageDistribution = [
  { name: 'Vietnamese', sessions: 4250, color: '#a85f31' },
  { name: 'English', sessions: 3180, color: '#c07a3e' },
  { name: 'Chinese', sessions: 2120, color: '#d99d2b' },
  { name: 'Japanese', sessions: 1580, color: '#9a6d54' },
  { name: 'Korean', sessions: 980, color: '#7e5742' },
  { name: 'French', sessions: 474, color: '#cab09c' },
];

export const listeningTrend7Days = [
  { date: 'Oct 1', sessions: 145 },
  { date: 'Oct 2', sessions: 168 },
  { date: 'Oct 3', sessions: 192 },
  { date: 'Oct 4', sessions: 175 },
  { date: 'Oct 5', sessions: 210 },
  { date: 'Oct 6', sessions: 248 },
  { date: 'Oct 7', sessions: 225 },
];

export const listeningTrend30Days = Array.from({ length: 30 }, (_, i) => ({
  date: `Sep ${i + 8}`,
  sessions: 120 + Math.floor(seededRandom(i + 700) * 130),
}));

export const listeningTrend3Months = Array.from({ length: 12 }, (_, i) => ({
  date: ['Jul W1', 'Jul W2', 'Jul W3', 'Jul W4', 'Aug W1', 'Aug W2', 'Aug W3', 'Aug W4', 'Sep W1', 'Sep W2', 'Sep W3', 'Sep W4'][i],
  sessions: 850 + Math.floor(seededRandom(i + 800) * 400),
}));

export const listeningTrend1Year = [
  { date: 'Jan', sessions: 5800 },
  { date: 'Feb', sessions: 6200 },
  { date: 'Mar', sessions: 7100 },
  { date: 'Apr', sessions: 8300 },
  { date: 'May', sessions: 9600 },
  { date: 'Jun', sessions: 11200 },
  { date: 'Jul', sessions: 13400 },
  { date: 'Aug', sessions: 15600 },
  { date: 'Sep', sessions: 14800 },
  { date: 'Oct', sessions: 12584 },
];

export const top10Pois = [
  { name: 'Chùa Cầu', sessions: 3248, avgTime: '07:12' },
  { name: 'Hội quán Phúc Kiến', sessions: 2856, avgTime: '06:48' },
  { name: 'Nhà cổ Tấn Ký', sessions: 2415, avgTime: '06:35' },
  { name: 'Sông Hoài', sessions: 2156, avgTime: '05:30' },
  { name: 'Chợ Hội An', sessions: 1982, avgTime: '05:54' },
  { name: 'Nhà cổ Phùng Hưng', sessions: 1654, avgTime: '06:21' },
  { name: 'Chùa Pháp Bảo', sessions: 1320, avgTime: '06:05' },
  { name: 'Hội quán Quảng Đông', sessions: 1105, avgTime: '05:42' },
  { name: 'Bảo tàng Sa Huỳnh', sessions: 875, avgTime: '06:18' },
  { name: 'Chợ đêm Hội An', sessions: 1542, avgTime: '04:55' },
].sort((a, b) => b.sessions - a.sessions);

export const avgTimeByPoi = [
  { name: 'Chùa Cầu', time: 7.2 },
  { name: 'Hội quán Phúc Kiến', time: 6.8 },
  { name: 'Nhà cổ Tấn Ký', time: 6.6 },
  { name: 'Nhà cổ Phùng Hưng', time: 6.4 },
  { name: 'Chùa Pháp Bảo', time: 6.1 },
  { name: 'Bảo tàng Sa Huỳnh', time: 6.3 },
  { name: 'Sông Hoài', time: 5.5 },
  { name: 'Chợ Hội An', time: 5.9 },
];

export const avgTimeByLanguage = [
  { name: 'Vietnamese', time: 6.8 },
  { name: 'English', time: 6.5 },
  { name: 'Chinese', time: 6.2 },
  { name: 'Japanese', time: 7.1 },
  { name: 'Korean', time: 6.0 },
  { name: 'French', time: 6.9 },
];

export const heatmapAreas = [
  { id: 1, name: 'Khu phố cổ', sessions: 5840, topPoi: 'Chùa Cầu', topLang: 'English', avgTime: '06:55', x: 45, y: 42, radius: 80 },
  { id: 2, name: 'Bờ sông Hoài', sessions: 3420, topPoi: 'Sông Hoài', topLang: 'Vietnamese', avgTime: '05:30', x: 52, y: 58, radius: 60 },
  { id: 3, name: 'Khu chợ Hội An', sessions: 2150, topPoi: 'Chợ Hội An', topLang: 'Chinese', avgTime: '05:54', x: 38, y: 55, radius: 55 },
  { id: 4, name: 'Khu chợ đêm', sessions: 1680, topPoi: 'Chợ đêm Hội An', topLang: 'Korean', avgTime: '04:55', x: 62, y: 65, radius: 45 },
  { id: 5, name: 'Khu hội quán', sessions: 2230, topPoi: 'Hội quán Phúc Kiến', topLang: 'English', avgTime: '06:48', x: 40, y: 38, radius: 50 },
  { id: 6, name: 'Khu nhà cổ', sessions: 1980, topPoi: 'Nhà cổ Tấn Ký', topLang: 'Japanese', avgTime: '06:35', x: 48, y: 35, radius: 45 },
];

export const adminProfile = {
  name: 'Administrator',
  email: 'admin@hoianaudioguide.vn',
  phone: '+84 510 3822 145',
  role: 'Administrator',
  createdAt: '2024-03-15',
  avatar: '',
};

export function searchAll(query: string): { category: string; label: string; link: string }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: { category: string; label: string; link: string }[] = [];
  pois.forEach(p => {
    if (p.name.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) {
      results.push({ category: 'POI', label: p.name, link: 'poi' });
    }
  });
  audioContents.forEach(a => {
    if (a.title.toLowerCase().includes(q) || a.language.toLowerCase().includes(q)) {
      results.push({ category: 'Audio Content', label: a.title, link: 'audio' });
    }
  });
  languages.forEach(l => {
    if (l.name.toLowerCase().includes(q)) {
      results.push({ category: 'Language', label: l.name, link: 'settings' });
    }
  });
  if ('statistics'.includes(q) || 'thống kê'.includes(q)) results.push({ category: 'Statistics', label: 'Thống kê & Phân tích', link: 'analytics' });
  if ('reports'.includes(q) || 'báo cáo'.includes(q)) results.push({ category: 'Reports', label: 'Báo cáo', link: 'reports' });
  if ('settings'.includes(q) || 'cài đặt'.includes(q)) results.push({ category: 'Settings', label: 'Cài đặt hệ thống', link: 'settings' });
  if ('heatmap'.includes(q)) results.push({ category: 'Analytics', label: 'Heatmap', link: 'heatmap' });
  if ('history'.includes(q) || 'lịch sử'.includes(q)) results.push({ category: 'Listening History', label: 'Lịch sử nghe', link: 'history' });
  if (q.length > 2 && results.length === 0) {
    results.push({ category: 'POI', label: `Tìm "${query}" trong POI`, link: 'poi' });
  }
  return results.slice(0, 8);
}
