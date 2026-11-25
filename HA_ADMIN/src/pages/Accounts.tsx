import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Lock, Unlock, Edit2, Search,
  Clock, CheckCircle, AlertCircle, UserCheck, Loader2, RefreshCw
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import Modal from '@/components/modals/Modal';
import { useToast } from '@/components/toast/ToastProvider';
import {
  getAdminAccounts,
  updateAccountStatus,
  createAdminAccount,
  updateAdminAccount,
  getActionLogs,
  AdminAccount,
  ActionLog
} from '@/services/adminAccountApi';
import { apiMessage } from '@/services/authApi';

export default function Accounts() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'accounts' | 'logs'>('accounts');

  // Account states
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [searchAccount, setSearchAccount] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'ADMIN' | 'MERCHANT'>('ADMIN');

  // Log states
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchLogUser, setSearchLogUser] = useState('');
  const [filterLogDate, setFilterLogDate] = useState('ALL');

  // Fetch accounts from real DB
  const loadAccounts = useCallback(async () => {
    try {
      setLoadingAccounts(true);
      const data = await getAdminAccounts();
      setAccounts(data);
    } catch (err) {
      showToast('error', apiMessage(err));
    } finally {
      setLoadingAccounts(false);
    }
  }, [showToast]);

  // Fetch audit logs from real DB
  const loadLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const data = await getActionLogs();
      setLogs(data);
    } catch (err) {
      showToast('error', apiMessage(err));
    } finally {
      setLoadingLogs(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, loadLogs]);

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
    const today = new Date().toISOString().split('T')[0];
    return logs.filter(log => {
      const matchUser = !searchLogUser ||
        log.username.toLowerCase().includes(searchLogUser.toLowerCase()) ||
        log.action.toLowerCase().includes(searchLogUser.toLowerCase()) ||
        log.target.toLowerCase().includes(searchLogUser.toLowerCase());
      const matchDate = filterLogDate === 'ALL' || (filterLogDate === 'TODAY' && log.date === today);
      return matchUser && matchDate;
    });
  }, [logs, searchLogUser, filterLogDate]);

  // Khóa / Mở khóa tài khoản
  const handleToggleLock = async (acc: AdminAccount) => {
    if (acc.username === 'admin') {
      showToast('warning', 'Không thể khóa tài khoản Quản trị viên chính.');
      return;
    }
    const newStatus = acc.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      const updated = await updateAccountStatus(acc.id, newStatus);
      setAccounts(prev => prev.map(a => a.id === acc.id ? updated : a));
      showToast('success', `${newStatus === 'ACTIVE' ? 'Đã mở khóa' : 'Đã khóa'} tài khoản "${acc.username}".`);
    } catch (err) {
      showToast('error', apiMessage(err));
    }
  };

  // Thêm tài khoản
  const handleCreateAccount = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formUsername.trim() || !formFullName.trim() || !formEmail.trim() || !formPassword.trim()) {
      showToast('error', 'Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    try {
      setSubmitting(true);
      const created = await createAdminAccount({
        username: formUsername.trim(),
        password: formPassword.trim(),
        fullName: formFullName.trim(),
        email: formEmail.trim(),
        role: formRole,
      });
      setAccounts(prev => [created, ...prev]);
      setShowAddModal(false);
      resetForm();
      showToast('success', `Đã tạo tài khoản "${created.username}" thành công.`);
    } catch (err) {
      showToast('error', apiMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Sửa tài khoản
  const handleUpdateAccount = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingAccount) return;
    if (!formFullName.trim() || !formEmail.trim()) {
      showToast('error', 'Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    try {
      setSubmitting(true);
      const updated = await updateAdminAccount(editingAccount.id, {
        fullName: formFullName.trim(),
        email: formEmail.trim(),
        role: formRole,
      });
      setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
      setEditingAccount(null);
      resetForm();
      showToast('success', 'Đã cập nhật thông tin tài khoản thành công.');
    } catch (err) {
      showToast('error', apiMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (acc: AdminAccount) => {
    setEditingAccount(acc);
    setFormFullName(acc.fullName);
    setFormEmail(acc.email);
    setFormRole(acc.role === 'MERCHANT' ? 'MERCHANT' : 'ADMIN');
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
            Quản trị danh sách người dùng quản trị viên và theo dõi nhật ký thao tác kiểm toán từ cơ sở dữ liệu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={activeTab === 'accounts' ? loadAccounts : loadLogs}
            icon={<RefreshCw className={`w-4 h-4 ${(loadingAccounts || loadingLogs) ? 'animate-spin' : ''}`} />}
          >
            Làm mới
          </Button>
          {activeTab === 'accounts' && (
            <Button onClick={() => setShowAddModal(true)} icon={<UserPlus className="w-4 h-4" />}>
              Thêm tài khoản mới
            </Button>
          )}
        </div>
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
              {loadingAccounts ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#286b7b]" />
                  <span className="text-sm">Đang tải danh sách tài khoản từ cơ sở dữ liệu...</span>
                </div>
              ) : filteredAccounts.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  Không tìm thấy tài khoản nào phù hợp.
                </div>
              ) : (
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Tài khoản & Họ tên</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase">Email</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600 text-xs uppercase">Vai trò</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600 text-xs uppercase">Trạng thái</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600 text-xs uppercase">Ngày tạo</th>
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
                          {acc.email || '—'}
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
                          {acc.createdAt || '—'}
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
              )}
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
              {loadingLogs ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#286b7b]" />
                  <span className="text-sm">Đang tải nhật ký kiểm toán từ cơ sở dữ liệu...</span>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  Chưa có nhật ký kiểm toán nào được ghi nhận.
                </div>
              ) : (
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
              )}
            </div>
          </div>
        )}
      </Card>

      {/* MODAL THÊM TÀI KHOẢN */}
      <Modal
        open={showAddModal}
        onClose={() => { if (!submitting) { setShowAddModal(false); resetForm(); } }}
        title="Thêm tài khoản quản trị mới"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setShowAddModal(false); resetForm(); }}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateAccount}
              disabled={submitting}
              icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
            >
              {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </Button>
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#286b7b]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Vai trò hệ thống</label>
            <select
              value={formRole}
              onChange={e => setFormRole(e.target.value as any)}
              disabled={submitting}
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
        onClose={() => { if (!submitting) { setEditingAccount(null); resetForm(); } }}
        title={editingAccount ? `Chỉnh sửa: @${editingAccount.username}` : ''}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setEditingAccount(null); resetForm(); }}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateAccount}
              disabled={submitting}
              icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
            >
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
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
                disabled={submitting}
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
                disabled={submitting}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#286b7b]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vai trò</label>
              <select
                value={formRole}
                onChange={e => setFormRole(e.target.value as any)}
                disabled={submitting}
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
