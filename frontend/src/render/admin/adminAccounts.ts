export type AdminRole = 'SUPER_ADMIN' | 'SUPPORT_ADMIN' | 'BILLING_ADMIN';

export interface AdminAccount {
  id: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: AdminRole;
  isLocked: boolean;
  lastLogin?: string;
}

const ADMIN_ACCOUNTS_STORAGE_KEY = 'sys_demo_admin_accounts';
const PLATFORM_SYNC_EVENT_NAME = 'sys_platform_sync_v1';

const emitAdminPlatformSync = (): void => {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(PLATFORM_SYNC_EVENT_NAME));
    }
  } catch {
    // Bỏ qua nếu môi trường không hỗ trợ window hoặc Event
  }
};

const pad2 = (num: number): string => String(num).padStart(2, '0');

const formatDatePartsToStandard = (
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number
): string | null => {
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return `${pad2(day)}/${pad2(month)}/${year} ${pad2(hours)}:${pad2(minutes)}`;
};

/**
 * Chuẩn hóa mọi chuỗi ngày giờ đăng nhập về định dạng đồng nhất: DD/MM/YYYY HH:mm
 */
export const formatLastLogin = (value?: string | null): string => {
  if (!value) return 'Chưa đăng nhập';
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === 'Chưa đăng nhập') return 'Chưa đăng nhập';

  // Dạng "HH:mm:ss DD/MM/YYYY" hoặc "HH:mm DD/MM/YYYY" (từ toLocaleString vi-VN)
  const timeFirstMatch = trimmed.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );
  if (timeFirstMatch) {
    const [, hh, min, , dd, mm, yyyy] = timeFirstMatch;
    const formatted = formatDatePartsToStandard(
      Number(yyyy),
      Number(mm),
      Number(dd),
      Number(hh),
      Number(min)
    );
    if (formatted) return formatted;
  }

  // Dạng "DD/MM/YYYY HH:mm:ss" hoặc "DD/MM/YYYY HH:mm" hoặc "D/M/YYYY H:mm"
  const dateFirstMatch = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (dateFirstMatch) {
    const [, dd, mm, yyyy, hh = '0', min = '0'] = dateFirstMatch;
    const formatted = formatDatePartsToStandard(
      Number(yyyy),
      Number(mm),
      Number(dd),
      Number(hh),
      Number(min)
    );
    if (formatted) return formatted;
  }

  // Dạng ISO timestamp hoặc chuỗi ngày giờ hợp lệ của Date
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const formatted = formatDatePartsToStandard(
      parsed.getFullYear(),
      parsed.getMonth() + 1,
      parsed.getDate(),
      parsed.getHours(),
      parsed.getMinutes()
    );
    if (formatted) return formatted;
  }

  return trimmed;
};

const normalizeAccountRecord = (acc: AdminAccount): AdminAccount => ({
  ...acc,
  lastLogin: formatLastLogin(acc.lastLogin)
});

const initialAccounts: AdminAccount[] = [
  {
    id: 'adm-1',
    username: 'adminlong',
    password: '123',
    fullName: 'Nguyễn Nhật Long',
    email: 'nhatlong.admin@drivelinker.vn',
    role: 'SUPER_ADMIN',
    isLocked: false,
    lastLogin: formatLastLogin('2026-11-27T08:30:00')
  },
  {
    id: 'adm-2',
    username: 'adminan',
    password: '123',
    fullName: 'Nguyễn Phạm Thiện Ân',
    email: 'thienan.admin@drivelinker.vn',
    role: 'SUPER_ADMIN',
    isLocked: false,
    lastLogin: formatLastLogin('2026-11-26T17:15:00')
  },
  {
    id: 'adm-3',
    username: 'support.bang',
    password: '123',
    fullName: 'Nguyễn Ngọc Bằng',
    email: 'ngocbang.support@drivelinker.vn',
    role: 'SUPPORT_ADMIN',
    isLocked: false,
    lastLogin: formatLastLogin('2026-11-27T09:05:00')
  },
  {
    id: 'adm-4',
    username: 'billing.minh',
    password: '123',
    fullName: 'Nguyễn Nhật Minh',
    email: 'nhatminh.billing@drivelinker.vn',
    role: 'BILLING_ADMIN',
    isLocked: false,
    lastLogin: formatLastLogin('2026-11-25T14:20:00')
  }
];

export const getAdminAccounts = (): AdminAccount[] => {
  try {
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      const seeded = initialAccounts.map(normalizeAccountRecord);
      localStorage.setItem(ADMIN_ACCOUNTS_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return initialAccounts.map(normalizeAccountRecord);
    }
    return (parsed as AdminAccount[]).map(normalizeAccountRecord);
  } catch {
    return initialAccounts.map(normalizeAccountRecord);
  }
};

export const saveAdminAccounts = (accounts: AdminAccount[]): void => {
  const normalized = accounts.map(normalizeAccountRecord);
  localStorage.setItem(ADMIN_ACCOUNTS_STORAGE_KEY, JSON.stringify(normalized));
  emitAdminPlatformSync();
};