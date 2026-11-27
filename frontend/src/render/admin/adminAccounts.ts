export type AdminRole = 'SUPER_ADMIN' | 'SUPPORT_ADMIN' | 'BILLING_ADMIN';
export type AdminStatus = 'ACTIVE' | 'LOCKED';

export interface AdminAccount {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: AdminRole;
  status: AdminStatus;
  lastLogin: string | null;
  password: string;
}

const STORAGE_KEY = 'sys_demo_admin_accounts';

export function formatLastLogin(value: string | null | undefined): string {
  if (!value || !value.trim() || value.trim() === 'Chưa đăng nhập') {
    return 'Chưa đăng nhập';
  }

  const raw = value.trim();

  // Chuẩn hóa dạng "HH:mm:ss DD/MM/YYYY" hoặc "HH:mm DD/MM/YYYY" -> "DD/MM/YYYY HH:mm"
  const timeFirstMatch = raw.match(
    /^(\d{1,2}:\d{2})(?::\d{2})?\s+(\d{1,2}\/\d{1,2}\/\d{4})$/
  );
  if (timeFirstMatch) {
    const [, hm, dmy] = timeFirstMatch;
    const [d, m, y] = dmy.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y} ${hm.padStart(5, '0')}`;
  }

  // Chuẩn hóa dạng "D/M/YYYY H:mm" hoặc "DD/MM/YYYY HH:mm:ss" -> "DD/MM/YYYY HH:mm"
  const dateFirstMatch = raw.match(
    /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2})(?::\d{2})?$/
  );
  if (dateFirstMatch) {
    const [, dmy, hm] = dateFirstMatch;
    const [d, m, y] = dmy.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y} ${hm.padStart(5, '0')}`;
  }

  // Chuẩn hóa chuỗi ISO / timestamp hợp lệ
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = parsed.getFullYear();
    const hh = String(parsed.getHours()).padStart(2, '0');
    const min = String(parsed.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  return raw;
}

const initialAccounts: AdminAccount[] = [
  {
    username: 'adminlong',
    fullName: 'Nguyễn Nhật Long',
    email: 'long@example.com',
    phone: '0901 234 567',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    lastLogin: formatLastLogin('20/11/2026 09:30'),
    password: '123456',
  },
  {
    username: 'adminan',
    fullName: 'Nguyễn Phạm Thiện Ân',
    email: 'an@example.com',
    phone: '0902 345 678',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    lastLogin: formatLastLogin('19/11/2026 14:15'),
    password: '123456',
  },
  {
    username: 'support.bang',
    fullName: 'Nguyễn Ngọc Bằng',
    email: 'bang@example.com',
    phone: '0903 456 789',
    role: 'SUPPORT_ADMIN',
    status: 'ACTIVE',
    lastLogin: formatLastLogin('18/11/2026 10:45'),
    password: '123456',
  },
  {
    username: 'billing.minh',
    fullName: 'Nguyễn Nhật Minh',
    email: 'minh@example.com',
    phone: '0904 567 890',
    role: 'BILLING_ADMIN',
    status: 'ACTIVE',
    lastLogin: null,
    password: '123456',
  },
];

// Tài khoản mẫu được lưu trong trình duyệt; khi chưa có dữ liệu thì dùng danh sách ban đầu.
export function getAdminAccounts(): AdminAccount[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return initialAccounts;
  try {
    const parsed: unknown = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return (parsed as AdminAccount[]).map((item) => ({
        ...item,
        lastLogin: item.lastLogin ? formatLastLogin(item.lastLogin) : null,
      }));
    }
  } catch {
    // Preserve unreadable data rather than silently overwriting it.
  }
  throw new Error('Không thể đọc dữ liệu tài khoản mẫu trên trình duyệt.');
}

export function saveAdminAccounts(accounts: AdminAccount[]) {
  const normalized = accounts.map((item) => ({
    ...item,
    lastLogin: item.lastLogin ? formatLastLogin(item.lastLogin) : null,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}