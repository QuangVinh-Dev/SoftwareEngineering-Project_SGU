import type { StallOwnerPOI, Language, AudioContent, ListeningHistoryEntry, ActivityLog, NotificationItem, StallOwnerProfile } from '@/types';

export const stallOwnerProfile: StallOwnerProfile = {
  name: 'Nguyễn Văn An',
  email: 'an@hoianaudioguide.vn',
  phone: '+84 905 123 456',
  stallName: 'Gian hàng Chùa Cầu',
  address: 'Nguyễn Thị Minh Khai, Cẩm Châu, Hội An',
  createdAt: '2024-06-10',
  avatar: '',
  accountStatus: 'approved',
};

export const myPois: StallOwnerPOI[] = [
  { id: 1, name: 'Chùa Cầu', nameEn: 'Japanese Covered Bridge', category: 'Di tích lịch sử', description: 'Biểu tượng của Hội An, cây cầu Nhật Bản được xây dựng vào thế kỷ 17 bởi thương nhân Nhật Bản.', address: 'Nguyễn Thị Minh Khai, Cẩm Châu, Hội An', lat: 15.8805, lng: 108.3380, radius: 50, image: '', listeningSessions: 3248, avgTime: '07:12', approvalStatus: 'approved', submittedAt: '2024-06-12', reviewedAt: '2024-06-13', status: 'active' },
  { id: 2, name: 'Hội quán Phúc Kiến', nameEn: 'Fukian Assembly Hall', category: 'Hội quán', description: 'Hội quán của cộng đồng người Hoa gốc Phúc Kiến, kiến trúc rực rỡ với rồng phượng.', address: '46 Trần Phú, Cẩm Châu, Hội An', lat: 15.8782, lng: 108.3370, radius: 50, image: '', listeningSessions: 2856, avgTime: '06:48', approvalStatus: 'approved', submittedAt: '2024-06-14', reviewedAt: '2024-06-15', status: 'active' },
  { id: 3, name: 'Nhà cổ Tấn Ký', nameEn: 'Tan Ky Old House', category: 'Nhà cổ', description: 'Nhà cổ gần 200 năm tuổi, kết hợp kiến trúc Việt Nam, Nhật Bản và Trung Hoa.', address: '101 Nguyễn Thái Học, Cẩm Châu, Hội An', lat: 15.8792, lng: 108.3375, radius: 50, image: '', listeningSessions: 2415, avgTime: '06:35', approvalStatus: 'approved', submittedAt: '2024-06-16', reviewedAt: '2024-06-17', status: 'active' },
  { id: 4, name: 'Đình làng Cẩm Nam', nameEn: 'Cam Nam Village Hall', category: 'Di tích lịch sử', description: 'Đình làng cổ kính, nơi thờ thần hoàng làng của cộng đồng Cẩm Nam.', address: 'Cẩm Nam, Hội An', lat: 15.8760, lng: 108.3400, radius: 50, image: '', listeningSessions: 0, avgTime: '00:00', approvalStatus: 'pending', submittedAt: '2026-10-05', status: 'inactive' },
  { id: 5, name: 'Cửa hiệu lụa tơ tằm', nameEn: 'Silk Shop Heritage', category: 'Làng nghề truyền thống', description: 'Cửa hiệu lụa cổ truyền, nơi du khách tìm hiểu nghề dệt tơ tằm Hội An.', address: '35 Trần Phú, Cẩm Châu, Hội An', lat: 15.8788, lng: 108.3378, radius: 40, image: '', listeningSessions: 0, avgTime: '00:00', approvalStatus: 'pending', submittedAt: '2026-10-07', status: 'inactive' },
  { id: 6, name: 'Lồng đèn lụa Hồng', nameEn: 'Hong Silk Lantern', category: 'Làng nghề truyền thống', description: 'Cửa hàng lồng đèn thủ công, biểu tượng văn hóa phố cổ Hội An.', address: '80 Nguyễn Thái Học, Cẩm Châu, Hội An', lat: 15.8798, lng: 108.3383, radius: 35, image: '', listeningSessions: 0, avgTime: '00:00', approvalStatus: 'rejected', submittedAt: '2026-09-28', reviewedAt: '2026-09-30', rejectionReason: 'Vị trí không chính xác, vui lòng cập nhật tọa độ GPS và gửi lại.', status: 'inactive' },
];

export const poiCategories = ['Di tích lịch sử', 'Hội quán', 'Nhà cổ', 'Chùa', 'Bảo tàng', 'Danh lam thắng cảnh', 'Chợ truyền thống', 'Làng nghề truyền thống'];

export const languages: Language[] = [
  { id: 1, name: 'Tiếng Việt', code: 'vi', status: true, isDefault: true },
  { id: 2, name: 'Tiếng Anh', code: 'en', status: true, isDefault: false },
  { id: 3, name: 'Tiếng Trung', code: 'zh', status: true, isDefault: false },
  { id: 4, name: 'Tiếng Nhật', code: 'ja', status: true, isDefault: false },
  { id: 5, name: 'Tiếng Hàn', code: 'ko', status: true, isDefault: false },
  { id: 6, name: 'Tiếng Pháp', code: 'fr', status: false, isDefault: false },
];

export const audioContents: AudioContent[] = [
  { id: 1, poiId: 1, poiName: 'Chùa Cầu', language: 'Tiếng Việt', title: 'Lịch sử Chùa Cầu', ttsVoice: 'vi-VN-HoaiTrang', duration: '07:12', status: 'enabled' },
  { id: 2, poiId: 1, poiName: 'Chùa Cầu', language: 'Tiếng Anh', title: 'Lịch sử Chùa Cầu (EN)', ttsVoice: 'en-US-JennyNeural', duration: '06:55', status: 'enabled' },
  { id: 3, poiId: 1, poiName: 'Chùa Cầu', language: 'Tiếng Nhật', title: 'Lịch sử Chùa Cầu (JA)', ttsVoice: 'ja-JP-Nanami', duration: '07:30', status: 'enabled' },
  { id: 4, poiId: 1, poiName: 'Chùa Cầu', language: 'Tiếng Trung', title: 'Lịch sử Chùa Cầu (ZH)', ttsVoice: 'zh-CN-XiaoxiaoNeural', duration: '06:40', status: 'enabled' },
  { id: 5, poiId: 1, poiName: 'Chùa Cầu', language: 'Tiếng Hàn', title: 'Lịch sử Chùa Cầu (KO)', ttsVoice: 'ko-KR-JiMin', duration: '06:50', status: 'enabled' },
  { id: 6, poiId: 2, poiName: 'Hội quán Phúc Kiến', language: 'Tiếng Việt', title: 'Hội quán Phúc Kiến', ttsVoice: 'vi-VN-NamMinh', duration: '06:48', status: 'enabled' },
  { id: 7, poiId: 2, poiName: 'Hội quán Phúc Kiến', language: 'Tiếng Anh', title: 'Hội quán Phúc Kiến (EN)', ttsVoice: 'en-US-GuyNeural', duration: '06:20', status: 'enabled' },
  { id: 8, poiId: 2, poiName: 'Hội quán Phúc Kiến', language: 'Tiếng Trung', title: 'Hội quán Phúc Kiến (ZH)', ttsVoice: 'zh-CN-YunxiNeural', duration: '06:35', status: 'enabled' },
  { id: 9, poiId: 3, poiName: 'Nhà cổ Tấn Ký', language: 'Tiếng Việt', title: 'Nhà cổ Tấn Ký', ttsVoice: 'vi-VN-HoaiTrang', duration: '06:35', status: 'enabled' },
  { id: 10, poiId: 3, poiName: 'Nhà cổ Tấn Ký', language: 'Tiếng Anh', title: 'Nhà cổ Tấn Ký (EN)', ttsVoice: 'en-US-JennyNeural', duration: '06:10', status: 'enabled' },
  { id: 11, poiId: 3, poiName: 'Nhà cổ Tấn Ký', language: 'Tiếng Nhật', title: 'Nhà cổ Tấn Ký (JA)', ttsVoice: 'ja-JP-KeitaNeural', duration: '06:25', status: 'disabled' },
  { id: 12, poiId: 1, poiName: 'Chùa Cầu', language: 'Tiếng Pháp', title: 'Lịch sử Chùa Cầu (FR)', ttsVoice: 'fr-FR-DeniseNeural', duration: '07:15', status: 'disabled' },
];

export const ttsVoices: { id: number; voice: string; language: string; gender: 'Nam' | 'Nữ'; status: boolean }[] = [
  { id: 1, voice: 'vi-VN-NamMinh', language: 'Tiếng Việt', gender: 'Nam', status: true },
  { id: 2, voice: 'vi-VN-HoaiTrang', language: 'Tiếng Việt', gender: 'Nữ', status: true },
  { id: 3, voice: 'en-US-GuyNeural', language: 'Tiếng Anh', gender: 'Nam', status: true },
  { id: 4, voice: 'en-US-JennyNeural', language: 'Tiếng Anh', gender: 'Nữ', status: true },
  { id: 5, voice: 'zh-CN-XiaoxiaoNeural', language: 'Tiếng Trung', gender: 'Nữ', status: true },
  { id: 6, voice: 'zh-CN-YunxiNeural', language: 'Tiếng Trung', gender: 'Nam', status: true },
  { id: 7, voice: 'ja-JP-Nanami', language: 'Tiếng Nhật', gender: 'Nữ', status: true },
  { id: 8, voice: 'ko-KR-JiMin', language: 'Tiếng Hàn', gender: 'Nữ', status: true },
  { id: 9, voice: 'fr-FR-DeniseNeural', language: 'Tiếng Pháp', gender: 'Nữ', status: false },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const approvedPoiNames = myPois.filter(p => p.approvalStatus === 'approved').map(p => p.name);
const langNames = ['Tiếng Việt', 'Tiếng Anh', 'Tiếng Trung', 'Tiếng Nhật', 'Tiếng Hàn', 'Tiếng Pháp'];
const histStatuses: ListeningHistoryEntry['status'][] = ['completed', 'completed', 'completed', 'partial', 'completed', 'skipped'];

export const listeningHistory: ListeningHistoryEntry[] = Array.from({ length: 80 }, (_, i) => {
  const date = new Date(2026, 9, 8);
  date.setDate(date.getDate() - Math.floor(i / 5));
  date.setHours(8 + (i % 12), (i * 7) % 60, 0);
  const poiIdx = Math.floor(seededRandom(i + 1) * approvedPoiNames.length);
  const langIdx = Math.floor(seededRandom(i + 100) * langNames.length);
  const min = 3 + Math.floor(seededRandom(i + 300) * 7);
  const sec = Math.floor(seededRandom(i + 400) * 60);
  const statusIdx = Math.floor(seededRandom(i + 500) * histStatuses.length);
  return {
    id: i + 1,
    datetime: date.toISOString().slice(0, 16).replace('T', ' '),
    poi: approvedPoiNames[poiIdx],
    language: langNames[langIdx],
    duration: `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`,
    status: histStatuses[statusIdx],
  };
});

export const activityLogs: ActivityLog[] = [
  { id: 1, time: '08:45', action: 'Cập nhật nội dung audio: Chùa Cầu — Tiếng Việt', icon: 'edit' },
  { id: 2, time: '08:32', action: 'Gửi POI mới: Đình làng Cẩm Nam', icon: 'plus' },
  { id: 3, time: '08:10', action: 'POI "Hội quán Phúc Kiến" đã được duyệt', icon: 'check' },
  { id: 4, time: '07:55', action: 'Đăng nhập vào hệ thống', icon: 'login' },
  { id: 5, time: '07:40', action: 'Gửi POI mới: Cửa hiệu lụa tơ tằm', icon: 'plus' },
  { id: 6, time: '07:20', action: 'Tắt nội dung audio: Nhà cổ Tấn Ký — Tiếng Nhật', icon: 'pause' },
  { id: 7, time: '06:55', action: 'POI "Lồng đèn lụa Hồng" bị từ chối duyệt', icon: 'x' },
];

export const notifications: NotificationItem[] = [
  { id: 1, title: 'POI đã được duyệt', message: 'POI "Hội quán Phúc Kiến" đã được quản trị viên duyệt.', time: '5 phút trước', read: false, type: 'approval', link: 'my-poi' },
  { id: 2, title: 'POI bị từ chối', message: 'POI "Lồng đèn lụa Hồng" bị từ chối. Vui lòng xem lý do và gửi lại.', time: '30 phút trước', read: false, type: 'approval', link: 'approval-status' },
  { id: 3, title: 'POI đang chờ duyệt', message: 'POI "Đình làng Cẩm Nam" đang chờ xét duyệt.', time: '2 giờ trước', read: false, type: 'poi', link: 'approval-status' },
  { id: 4, title: 'Nội dung audio được cập nhật', message: 'Nội dung Tiếng Pháp cho Chùa Cầu đã bị tắt.', time: '1 ngày trước', read: true, type: 'audio', link: 'audio' },
];

export const languageDistribution = [
  { name: 'Tiếng Việt', sessions: 1850, color: '#2563eb' },
  { name: 'Tiếng Anh', sessions: 1420, color: '#3b82f6' },
  { name: 'Tiếng Trung', sessions: 980, color: '#60a5fa' },
  { name: 'Tiếng Nhật', sessions: 720, color: '#93c5fd' },
  { name: 'Tiếng Hàn', sessions: 450, color: '#bfdbfe' },
  { name: 'Tiếng Pháp', sessions: 120, color: '#dbeafe' },
];

export const listeningTrend7Days = [
  { date: 'T10/2', sessions: 45 },
  { date: 'T10/3', sessions: 58 },
  { date: 'T10/4', sessions: 72 },
  { date: 'T10/5', sessions: 65 },
  { date: 'T10/6', sessions: 88 },
  { date: 'T10/7', sessions: 95 },
  { date: 'T10/8', sessions: 82 },
];

export const listeningTrend30Days = Array.from({ length: 30 }, (_, i) => ({
  date: `T9/${i + 8}`,
  sessions: 40 + Math.floor(seededRandom(i + 700) * 80),
}));

export const listeningTrend3Months = Array.from({ length: 12 }, (_, i) => ({
  date: ['T7/T1', 'T7/T2', 'T7/T3', 'T7/T4', 'T8/T1', 'T8/T2', 'T8/T3', 'T8/T4', 'T9/T1', 'T9/T2', 'T9/T3', 'T9/T4'][i],
  sessions: 350 + Math.floor(seededRandom(i + 800) * 200),
}));

export const myPoiStats = [
  { name: 'Chùa Cầu', sessions: 3248, avgTime: '07:12' },
  { name: 'Hội quán Phúc Kiến', sessions: 2856, avgTime: '06:48' },
  { name: 'Nhà cổ Tấn Ký', sessions: 2415, avgTime: '06:35' },
];

export const avgTimeByPoi = [
  { name: 'Chùa Cầu', time: 7.2 },
  { name: 'Hội quán Phúc Kiến', time: 6.8 },
  { name: 'Nhà cổ Tấn Ký', time: 6.6 },
];

export const avgTimeByLanguage = [
  { name: 'Tiếng Việt', time: 6.8 },
  { name: 'Tiếng Anh', time: 6.5 },
  { name: 'Tiếng Trung', time: 6.2 },
  { name: 'Tiếng Nhật', time: 7.1 },
  { name: 'Tiếng Hàn', time: 6.0 },
  { name: 'Tiếng Pháp', time: 6.9 },
];

export function searchAll(query: string): { category: string; label: string; link: string }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: { category: string; label: string; link: string }[] = [];
  myPois.forEach(p => {
    if (p.name.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) {
      results.push({ category: 'POI của tôi', label: p.name, link: 'my-poi' });
    }
  });
  audioContents.forEach(a => {
    if (a.title.toLowerCase().includes(q) || a.language.toLowerCase().includes(q)) {
      results.push({ category: 'Nội dung audio', label: a.title, link: 'audio' });
    }
  });
  if ('thống kê'.includes(q)) results.push({ category: 'Thống kê', label: 'Thống kê lượt nghe', link: 'stats' });
  if ('trạng thái'.includes(q) || 'duyệt'.includes(q)) results.push({ category: 'Tài khoản', label: 'Trạng thái duyệt', link: 'approval-status' });
  if ('tài khoản'.includes(q)) results.push({ category: 'Tài khoản', label: 'Tài khoản của tôi', link: 'account' });
  if (q.length > 2 && results.length === 0) {
    results.push({ category: 'POI của tôi', label: `Tìm "${query}" trong POI của tôi`, link: 'my-poi' });
  }
  return results.slice(0, 8);
}
