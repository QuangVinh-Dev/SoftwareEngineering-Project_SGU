import { useState, useMemo } from 'react';
import {
  Users, UserPlus, Lock, Unlock, Edit2, Search,
  Clock, CheckCircle, AlertCircle, UserCheck
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import Modal from '@/components/modals/Modal';
import { useToast } from '@/components/toast/ToastProvider';

interface AdminAccount {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'MERCHANT';
  status: 'ACTIVE' | 'LOCKED';
  createdAt: string;
  lastLogin?: string;
}

interface ActionLog {
  id: number;
  time: string;
  date: string;
  username: string;
  role: string;
  action: string;
  target: string;
  ip: string;
}

const INITIAL_ACCOUNTS: AdminAccount[] = [
  {
    id: 1,
    username: 'admin',
    fullName: 'Quản trị viên hệ thống',
    email: 'admin@hoian.vn',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-15',
    lastLogin: '2026-10-27 08:15',
  },
  {
    id: 2,
    username: 'editor01',
    fullName: 'Nguyễn Văn An',
    email: 'an.nv@hoian.vn',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-03-20',
    lastLogin: '2026-10-26 16:40',
  },
  {
    id: 3,
    username: 'banhmi_phuong',
    fullName: 'Lê Thị Phượng',
    email: 'phuong.lt@gmail.com',
    role: 'MERCHANT',
    status: 'ACTIVE',
    createdAt: '2026-08-12',
    lastLogin: '2026-10-24 09:30',
  },
  {
    id: 4,
    username: 'caolau_bamy',
    fullName: 'Trần Thị Mỹ',
    email: 'my.tt@gmail.com',
    role: 'MERCHANT',
    status: 'ACTIVE',
    createdAt: '2026-07-05',
    lastLogin: '2026-09-18 14:10',
  },
];

const INITIAL_LOGS: ActionLog[] = [
  { id: 1, time: '08:45:12', date: '2026-10-27', username: 'admin', role: 'ADMIN', action: 'Duyệt bản ghi âm tiếng Nhật', target: 'Chùa Cầu', ip: '192.168.1.10' },
  { id: 2, time: '08:32:05', date: '2026-10-27', username: 'admin', role: 'ADMIN', action: 'Phê duyệt hồ sơ gian hàng', target: 'Quán Cao Lầu Thanh', ip: '192.168.1.14' },
  { id: 3, time: '08:10:44', date: '2026-10-27', username: 'admin', role: 'ADMIN', action: 'Xuất báo cáo lượt nghe tháng 10', target: 'Báo cáo PDF', ip: '192.168.1.14' },
  { id: 4, time: '07:55:18', date: '2026-10-27', username: 'editor01', role: 'ADMIN', action: 'Chỉnh sửa tọa độ bán kính POI', target: 'Hội quán Phúc Kiến', ip: '192.168.1.25' },
  { id: 5, time: '16:20:30', date: '2026-10-26', username: 'admin', role: 'ADMIN', action: 'Cập nhật trạng thái tài khoản', target: 'caolau_bamy', ip: '192.168.1.10' },
  { id: 6, time: '14:15:22', date: '2026-10-26', username: 'editor01', role: 'ADMIN', action: 'Chạy dịch tự động tiếng Hàn', target: 'Nhà cổ Tấn Ký', ip: '192.168.1.25' },
  { id: 7, time: '09:05:11', date: '2026-10-25', username: 'admin', role: 'ADMIN', action: 'Thêm điểm tham quan POI mới', target: 'Bảo tàng Sa Huỳnh', ip: '192.168.1.14' },
];

export default function Accounts() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'accounts' | 'logs'>('accounts');

  // Account states
  const [accounts, setAccounts] = useState<AdminAccount[]>(INITIAL_ACCOUNTS);
  const [searchAccount, setSearchAccount] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'ADMIN' | 'MERCHANT'>('ADMIN');

  // Log states
  const [logs] = useState<ActionLog[]>(INITIAL_LOGS);
  const [searchLogUser, setSearchLogUser] = useState('');
  const [filterLogDate, setFilterLogDate] = useState('ALL');

  // Lọc tài khoản
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchRole = filterRole === 'ALL' || acc.role === filterRole;
      const q = searchAccount.toLowerCase().trim();
      const matchSearch = !q ||
        acc.username.toLowerCase().includes(q) ||
        acc.fullName.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [accounts, filterRole, searchAccount]);

  // Lọc nhật ký
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchUser = !searchLogUser || log.username.toLowerCase().includes(searchLogUser.toLowerCase()) || log.action.toLowerCase().includes(searchLogUser.toLowerCase());
      const matchDate = filterLogDate === 'ALL' || (filterLogDate === 'TODAY' && log.date === '2026-10-27');
      return matchUser && matchDate;
    });
  }, [logs, searchLogUser, filterLogDate]);

  // Khóa / Mở khóa tài khoản
  const handleToggleLock = (acc: AdminAccount) => {
    if (acc.username === 'admin') {
      showToast('warning', 'Không thể khóa tài khoản Quản trị viên chính.');
      return;
    }
    const newStatus = acc.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, status: newStatus } : a));
    showToast('success', `${newStatus === 'ACTIVE' ? 'Đã mở khóa' : 'Đã khóa'} tài khoản "${acc.username}".`);
  };

  // Thêm tài khoản
  const handleCreateAccount = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formUsername.trim() || !formFullName.trim() || !formEmail.trim() || !formPassword.trim()) {
      showToast('error', 'Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    const newAcc: AdminAccount = {
      id: Date.now(),
      username: formUsername.trim(),
      fullName: formFullName.trim(),
      email: formEmail.trim(),
      role: formRole,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Chưa đăng nhập',
    };
    setAccounts(prev => [newAcc, ...prev]);
    setShowAddModal(false);
    resetForm();
    showToast('success', `Đã tạo tài khoản "${newAcc.username}" thành công.`);
  };

  // Sửa tài khoản
  const handleUpdateAccount = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingAccount) return;
    setAccounts(prev => prev.map(a => a.id === editingAccount.id ? {
      ...a,
      fullName: formFullName.trim(),
      email: formEmail.trim(),
      role: formRole,
    } : a));
    setEditingAccount(null);
    resetForm();
    showToast('success', 'Đã cập nhật thông tin tài khoản thành công.');
  };

  const openEditModal = (acc: AdminAccount) => {
    setEditingAccount(acc);
    setFormFullName(acc.fullName);
    setFormEmail(acc.email);
    setFormRole(acc.role);
  };

  const resetForm = () => {
    setFormUsername('');
    setFormFullName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('ADMIN');
  };

  const roleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#f0f8f9] text-[#286b7b] border border-[#286b7b]/20">
          QUẢN TRỊ VIÊN
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        CHỦ GIAN HÀNG
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-[#286b7b]" />
            Quản lý tài khoản quản trị
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản trị danh sách người dùng quản trị viên và theo dõi nhật ký thao tác kiểm toán.
          </p>
        </div>
        {activeTab === 'accounts' && (
          <Button onClick={() => setShowAddModal(true)} icon={<UserPlus className="w-4 h-4" />}>
            Thêm tài khoản mới
          </Button>
        )}
      </div>

      {/* Main Card with Tabs */}
      <Card noPadding>
        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 pt-3">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'accounts'
                ? 'border-[#286b7b] text-[#286b7b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Danh sách tài khoản ({accounts.length})
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'border-[#286b7b] text-[#286b7b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Nhật ký kiểm toán thao tác ({logs.length})
          </button>
        </div>

        {/* TAB 1: QUẢN LÝ TÀI KHOẢN */}
        {activeTab === 'accounts' && (
          <div>
            {/* Filter bar */}
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 font-medium mr-1">Bộ lọc:</span>
                {[
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'ADMIN', label: 'Quản trị viên' },
                  { key: 'MERCHANT', label: 'Chủ gian hàng' },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setFilterRole(item.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      filterRole === item.key
                        ? 'bg-[#286b7b] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={searchAccount}
                  onChange={e => setSearchAccount(e.target.value)}
                  placeholder="Tìm tài khoản, tên, email..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#286b7b]"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Tài khoản & Họ tên</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Email</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600 text-xs uppercase">Vai trò</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600 text-xs uppercase">Trạng thái</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600 text-xs uppercase">Lần đăng nhập cuối</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600 text-xs uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAccounts.map(acc => (
                    <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{acc.fullName}</div>
                        <div className="text-xs text-slate-400 font-mono">@{acc.username}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {acc.email}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {roleBadge(acc.role)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {acc.status === 'ACTIVE' ? (
                          <Badge variant="active">Đang hoạt động</Badge>
                        ) : (
                          <Badge variant="skipped">Đã bị khóa</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-500">
                        {acc.lastLogin || 'Chưa đăng nhập'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openEditModal(acc)}
                            icon={<Edit2 className="w-3.5 h-3.5" />}
                          >
                            Sửa
                          </Button>
                          {acc.username !== 'admin' && (
                            <Button
                              size="sm"
                              variant={acc.status === 'ACTIVE' ? 'danger' : 'success'}
                              onClick={() => handleToggleLock(acc)}
                              icon={acc.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            >
                              {acc.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: NHẬT KÝ THAO TÁC */}
        {activeTab === 'logs' && (
          <div>
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Thời gian:</span>
                <button
                  onClick={() => setFilterLogDate('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    filterLogDate === 'ALL' ? 'bg-[#286b7b] text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFilterLogDate('TODAY')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    filterLogDate === 'TODAY' ? 'bg-[#286b7b] text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Hôm nay
                </button>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={searchLogUser}
                  onChange={e => setSearchLogUser(e.target.value)}
                  placeholder="Lọc thao tác, người dùng..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#286b7b]"
                />
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Thời gian</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Người thực hiện</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Hành động</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Đối tượng</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600 text-xs uppercase">Địa chỉ IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {log.date} {log.time}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">@{log.username}</span>
                        <span className="ml-2 text-[10px] uppercase font-bold text-[#286b7b]">({log.role})</span>
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-medium">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {log.target}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-400">
                        {log.ip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* MODAL THÊM TÀI KHOẢN */}
      <Modal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title="Thêm tài khoản quản trị mới"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>Hủy</Button>
            <Button variant="primary" onClick={handleCreateAccount}>Tạo tài khoản</Button>
          </>
        }
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên đăng nhập *</label>
            <input
              required
              value={formUsername}
              onChange={e => setFormUsername(e.target.value)}
              placeholder="ví dụ: admin_vanhanh"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#286b7b]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên *</label>
            <input
              required
              value={formFullName}
              onChange={e => setFormFullName(e.target.value)}
              placeholder="ví dụ: Trần Văn Nam"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#286b7b]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
            <input
              required
              type="email"
              value={formEmail}
              onChange={e => setFormEmail(e.target.value)}
              placeholder="namtv@hoianheritage.vn"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#286b7b]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu khởi tạo *</label>
            <input
              required
              type="password"
              value={formPassword}
              onChange={e => setFormPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#286b7b]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Vai trò hệ thống</label>
            <select
              value={formRole}
              onChange={e => setFormRole(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:border-[#286b7b]"
            >
              <option value="ADMIN">ADMIN (Quản trị viên toàn quyền)</option>
              <option value="MERCHANT">MERCHANT (Chủ gian hàng đối tác)</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* MODAL SỬA THÔNG TIN TÀI KHOẢN */}
      <Modal
        open={editingAccount !== null}
        onClose={() => setEditingAccount(null)}
        title={editingAccount ? `Chỉnh sửa: @${editingAccount.username}` : ''}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingAccount(null)}>Hủy</Button>
            <Button variant="primary" onClick={handleUpdateAccount}>Lưu thay đổi</Button>
          </>
        }
      >
        {editingAccount && (
          <form onSubmit={handleUpdateAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên *</label>
              <input
                required
                value={formFullName}
                onChange={e => setFormFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#286b7b]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input
                required
                type="email"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#286b7b]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vai trò</label>
              <select
                value={formRole}
                onChange={e => setFormRole(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:border-[#286b7b]"
              >
                <option value="ADMIN">ADMIN (Quản trị viên)</option>
                <option value="MERCHANT">MERCHANT (Chủ gian hàng)</option>
              </select>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
