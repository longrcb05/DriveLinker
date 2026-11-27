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
const initialAccounts: AdminAccount[] = [
  { username: 'adminlong', fullName: 'Nguyễn Nhật Long', email: 'long@example.com', phone: '0901 234 567', role: 'SUPER_ADMIN', status: 'ACTIVE', lastLogin: '20/11/2026 09:30', password: '123456' },
  { username: 'adminan', fullName: 'Nguyễn Phạm Thiện Ân', email: 'an@example.com', phone: '0902 345 678', role: 'SUPER_ADMIN', status: 'ACTIVE', lastLogin: '19/11/2026 14:15', password: '123456' },
  { username: 'support.bang', fullName: 'Nguyễn Ngọc Bằng', email: 'bang@example.com', phone: '0903 456 789', role: 'SUPPORT_ADMIN', status: 'ACTIVE', lastLogin: '18/11/2026 10:45', password: '123456' },
  { username: 'billing.minh', fullName: 'Nguyễn Nhật Minh', email: 'minh@example.com', phone: '0904 567 890', role: 'BILLING_ADMIN', status: 'ACTIVE', lastLogin: null, password: '123456' },
];

// Tài khoản mẫu được lưu trong trình duyệt; khi chưa có dữ liệu thì dùng danh sách ban đầu.
export function getAdminAccounts(): AdminAccount[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return initialAccounts;
  try {
    const parsed: unknown = JSON.parse(saved);
    if (Array.isArray(parsed)) return parsed as AdminAccount[];
  } catch {
    // Preserve unreadable data rather than silently overwriting it.
  }
  throw new Error('Không thể đọc dữ liệu tài khoản mẫu trên trình duyệt.');
}

export function saveAdminAccounts(accounts: AdminAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}
